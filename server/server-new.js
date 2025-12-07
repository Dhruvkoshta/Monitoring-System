const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, dbOperations } = require('./db/index.js');

// --- CONFIGURATION ---
const PORT = 5000;
const app = express();
const server = http.createServer(app);

// Enable CORS so React (port 5173) can talk to Node (port 5000)
app.use(cors());
app.use(bodyParser.json());

// Setup Socket.io for Realtime Frontend updates
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from anywhere (for dev)
    methods: ['GET', 'POST'],
  },
});

// Initialize Database
try {
  initDatabase();
  console.log('✅ Database initialized');

  // Initialize rooms data
  const initialRooms = [
    {
      id: '1',
      name: 'Living Room',
      location: 'Ground Floor',
      description: 'Main living area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Kitchen',
      location: 'Ground Floor',
      description: 'Cooking area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Master Bedroom',
      location: 'First Floor',
      description: 'Main bedroom',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      name: 'Basement',
      location: 'Basement',
      description: 'Storage area',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      name: 'Garage',
      location: 'Ground Floor',
      description: 'Vehicle parking',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Upsert initial rooms
  initialRooms.forEach(async (room) => {
    await dbOperations.upsertRoom(room);
  });
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// --- IN-MEMORY CACHE FOR CURRENT STATE ---
let roomsData = [];
let commandQueue = {};

// Load rooms from database
(async () => {
  const dbRooms = await dbOperations.getAllRooms();
  roomsData = dbRooms.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 0,
    quakeIntensity: 0.0,
    rssi: -45,
    temperature: 22,
    humidity: 45,
    lastUpdate: Date.now(),
    status: 'normal',
    isActive: r.isActive,
  }));
})();

// --- HELPER FUNCTIONS ---

// Send Push Notification via ntfy.sh
async function sendPushNotification(title, body, priority = 'high', tags = 'warning') {
  try {
    const response = await fetch('https://ntfy.sh/alert', {
      method: 'POST',
      body: body,
      headers: {
        Title: title,
        Priority: priority,
        Tags: tags,
      },
    });

    if (response.ok) {
      console.log(`📲 Push notification sent: ${title}`);
    } else {
      console.error('❌ Failed to send push notification:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
}

function determineEventType(data) {
  if (data.fire || data.quake || (data.flood && data.floodLevel > 50)) {
    return 'critical';
  } else if (data.flood || data.floodLevel > 30) {
    return 'warning';
  } else if (data.floodLevel > 10) {
    return 'alert';
  }
  return 'heartbeat';
}

function createLogMessage(room, data) {
  const alerts = [];
  if (data.fire) alerts.push('🔥 FIRE DETECTED');
  if (data.flood) alerts.push(`💧 FLOOD ${data.floodLevel}%`);
  if (data.quake) alerts.push(`🌊 QUAKE ${data.quakeIntensity}`);

  if (alerts.length > 0) {
    return `${alerts.join(', ')} in ${room.name}`;
  }
  return `Normal reading from ${room.name}`;
}

async function saveSensorLog(room, data) {
  try {
    const status =
      data.fire || data.quake || data.flood
        ? 'critical'
        : data.floodLevel > 30
          ? 'warning'
          : 'normal';

    const eventType = determineEventType(data);
    const message = createLogMessage(room, data);

    const log = {
      roomId: room.id,
      roomName: room.name,
      location: room.location,
      fire: data.fire || false,
      flood: data.flood || false,
      quake: data.quake || false,
      floodLevel: data.floodLevel || 0,
      quakeIntensity: data.quakeIntensity || 0.0,
      temperature: data.temperature,
      humidity: data.humidity,
      rssi: data.rssi || -45,
      status,
      eventType,
      message,
      timestamp: new Date(data.timestamp || Date.now()),
      createdAt: new Date(),
    };

    await dbOperations.insertSensorLog(log);

    // Create alert events for critical conditions
    if (data.fire) {
      await dbOperations.insertAlertEvent({
        roomId: room.id,
        roomName: room.name,
        alertType: 'fire',
        severity: 'critical',
        value: 1,
        resolved: false,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Send push notification
      await sendPushNotification(
        '🔥 FIRE ALERT - CRITICAL',
        `Fire detected in ${room.name} (${room.location}). Evacuate immediately!`,
        'urgent',
        'fire,warning,rotating_light'
      );
    }

    if (data.flood && data.floodLevel > 40) {
      const severity = data.floodLevel > 60 ? 'critical' : 'warning';
      await dbOperations.insertAlertEvent({
        roomId: room.id,
        roomName: room.name,
        alertType: 'flood',
        severity: severity,
        value: data.floodLevel,
        resolved: false,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Send push notification
      const priority = severity === 'critical' ? 'urgent' : 'high';
      const emoji = severity === 'critical' ? '🌊' : '💧';
      await sendPushNotification(
        `${emoji} FLOOD ALERT - ${severity.toUpperCase()}`,
        `Flood detected in ${room.name} (${room.location}). Water level: ${data.floodLevel}%`,
        priority,
        'droplet,warning'
      );
    }

    if (data.quake && data.quakeIntensity > 4.0) {
      const severity = data.quakeIntensity > 6.0 ? 'critical' : 'warning';
      await dbOperations.insertAlertEvent({
        roomId: room.id,
        roomName: room.name,
        alertType: 'quake',
        severity: severity,
        value: data.quakeIntensity,
        resolved: false,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Send push notification
      const priority = severity === 'critical' ? 'urgent' : 'high';
      await sendPushNotification(
        `🌊 EARTHQUAKE ALERT - ${severity.toUpperCase()}`,
        `Earthquake detected in ${room.name} (${room.location}). Magnitude: ${data.quakeIntensity}`,
        priority,
        'warning,zap'
      );
    }

    return log;
  } catch (error) {
    console.error('Error saving sensor log:', error);
  }
}

// --- API ENDPOINTS (ESP32/Serial DATA) ---

// 1. RECEIVE DATA from ESP32 or Serial
app.post('/api/readings', async (req, res) => {
  const data = req.body;
  const roomId = data.id;

  console.log(`📡 Received from device (Room ${roomId}):`, data);

  // Find room
  const roomIndex = roomsData.findIndex((r) => r.id === roomId);
  if (roomIndex !== -1) {
    const room = roomsData[roomIndex];

    // Determine status
    let status = 'normal';
    if (data.fire || data.quake || data.flood) status = 'critical';
    else if (data.floodLevel > 30) status = 'warning';

    // Update room data
    roomsData[roomIndex] = {
      ...room,
      ...data,
      status,
      lastUpdate: Date.now(),
      isActive: true,
    };

    // Save to database
    await saveSensorLog(room, data);

    // Push updates to connected clients
    io.emit('sensor-update', data);
    io.emit('rooms-update', roomsData);
  } else {
    console.log(`⚠️ Unknown room: ${roomId}`);
  }

  res.status(200).json({ status: 'success' });
});

// --- DATABASE API ENDPOINTS (React Frontend) ---

// Get all logs with pagination
app.get('/api/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const logs = await dbOperations.getSensorLogs(limit, offset);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get logs by room
app.get('/api/logs/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const logs = await dbOperations.getSensorLogsByRoom(roomId, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching room logs:', error);
    res.status(500).json({ error: 'Failed to fetch room logs' });
  }
});

// Search logs
app.get('/api/logs/search', async (req, res) => {
  try {
    const { search = '', roomId, eventType, status, startDate, endDate } = req.query;

    const filters = {};
    if (roomId) filters.roomId = roomId;
    if (eventType) filters.eventType = eventType;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const logs = await dbOperations.searchSensorLogs(search, filters);
    res.json(logs);
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({ error: 'Failed to search logs' });
  }
});

// Get log statistics
app.get('/api/logs/stats', async (req, res) => {
  try {
    const stats = await dbOperations.getLogStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create a log (for manual logging from frontend)
app.post('/api/logs', async (req, res) => {
  try {
    const logData = req.body;
    const result = await dbOperations.insertSensorLog({
      ...logData,
      createdAt: new Date(),
    });
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// Get active alerts
app.get('/api/alerts/active', async (req, res) => {
  try {
    const alerts = await dbOperations.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get recent alerts
app.get('/api/alerts/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const alerts = await dbOperations.getRecentAlerts(limit);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Resolve alert
app.patch('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const result = await dbOperations.resolveAlert(alertId);
    res.json(result[0]);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await dbOperations.getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Commands endpoint (for ESP32 polling)
app.get('/api/commands', (req, res) => {
  const roomId = req.query.id;
  if (roomId && commandQueue[roomId]) {
    res.json({ command: commandQueue[roomId] });
    console.log(`Command fetched by Room ${roomId}:`, commandQueue[roomId]);
    delete commandQueue[roomId];
  } else {
    res.json({ command: null });
  }
});

// Control endpoint (React sends commands)
app.post('/api/control', (req, res) => {
  const { cmd, roomId } = req.body;
  console.log(`Received Command from React: ${cmd} for Room: ${roomId || 'ALL'}`);

  if (roomId) {
    commandQueue[roomId] = cmd;
  } else {
    roomsData.forEach((r) => {
      commandQueue[r.id] = cmd;
    });
  }

  res.status(200).send({ status: 'Command Queued' });
});

// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: SQLite with Drizzle ORM`);
  console.log(`📡 ESP32 endpoint: http://<YOUR_PC_IP>:${PORT}/api/readings`);
});
