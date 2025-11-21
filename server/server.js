const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// --- MOCK DATABASE (In-Memory) ---
// Initial rooms data matching frontend mock
let roomsData = [
  {
    id: '1',
    name: 'Living Room',
    location: 'Ground Floor',
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
    isActive: true,
  },
  {
    id: '2',
    name: 'Kitchen',
    location: 'Ground Floor',
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 15,
    quakeIntensity: 0.0,
    rssi: -52,
    temperature: 24,
    humidity: 55,
    lastUpdate: Date.now(),
    status: 'normal',
    isActive: true,
  },
  {
    id: '3',
    name: 'Master Bedroom',
    location: 'First Floor',
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 0,
    quakeIntensity: 0.0,
    rssi: -60,
    temperature: 20,
    humidity: 40,
    lastUpdate: Date.now(),
    status: 'normal',
    isActive: true,
  },
  {
    id: '4',
    name: 'Basement',
    location: 'Basement',
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 35,
    quakeIntensity: 0.0,
    rssi: -70,
    temperature: 18,
    humidity: 65,
    lastUpdate: Date.now(),
    status: 'warning',
    isActive: true,
  },
  {
    id: '5',
    name: 'Garage',
    location: 'Ground Floor',
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 0,
    quakeIntensity: 0.0,
    rssi: -55,
    temperature: 19,
    humidity: 50,
    lastUpdate: Date.now(),
    status: 'normal',
    isActive: true,
  },
];

// Overall system status
let currentData = {
  fire: false,
  flood: false,
  quake: false,
  floodLevel: 0,
  quakeIntensity: 0.0,
  rssi: 0,
  timestamp: Date.now(),
};

let commandQueue = {}; // Store commands per room ID

// --- HELPER FUNCTIONS ---
function updateOverallStatus() {
  let fire = false;
  let flood = false;
  let quake = false;
  let maxFloodLevel = 0;
  let maxQuakeIntensity = 0.0;
  let avgRssi = 0;
  let activeCount = 0;

  roomsData.forEach((room) => {
    if (room.isActive) {
      if (room.fire) fire = true;
      if (room.flood) flood = true;
      if (room.quake) quake = true;
      if (room.floodLevel > maxFloodLevel) maxFloodLevel = room.floodLevel;
      if (room.quakeIntensity > maxQuakeIntensity) maxQuakeIntensity = room.quakeIntensity;
      avgRssi += room.rssi;
      activeCount++;
    }
  });

  if (activeCount > 0) avgRssi = Math.floor(avgRssi / activeCount);

  currentData = {
    fire,
    flood,
    quake,
    floodLevel: maxFloodLevel,
    quakeIntensity: maxQuakeIntensity,
    rssi: avgRssi,
    timestamp: Date.now(),
  };
}

// --- API ENDPOINTS (ESP32 TALKS TO THESE) ---

// 1. RECEIVE DATA from ESP32
app.post('/api/readings', (req, res) => {
  const data = req.body;
  const roomId = data.id;

  console.log(`Received from ESP32 (Room ${roomId}):`, data);

  // Find and update room
  const roomIndex = roomsData.findIndex((r) => r.id === roomId);
  if (roomIndex !== -1) {
    // Determine status based on sensor values
    let status = 'normal';
    if (data.fire || data.quake || data.flood) status = 'critical';
    else if (data.floodLevel > 30) status = 'warning';

    roomsData[roomIndex] = {
      ...roomsData[roomIndex],
      ...data,
      status,
      lastUpdate: Date.now(),
      isActive: true,
    };
  } else {
    // Optional: Auto-add new room if not exists
    console.log(`New room detected: ${roomId}`);
    // For now, we ignore unknown rooms or you could add logic to append to roomsData
  }

  // Update overall status
  updateOverallStatus();

  // Push updates to all connected React Clients
  io.emit('sensor-update', currentData); // Update overall dashboard
  io.emit('rooms-update', roomsData); // Update rooms list

  res.status(200).send('Data Received');
});

// 2. ESP32 CHECKS FOR COMMANDS
app.get('/api/commands', (req, res) => {
  // ESP32 polls this endpoint.
  // Ideally ESP32 should send its ID to get specific commands.
  // For now, we'll return the first available command or broadcast.
  // If query param ?id=1 is present, return command for that room.

  const roomId = req.query.id;

  if (roomId && commandQueue[roomId]) {
    res.json({ command: commandQueue[roomId] });
    console.log(`Command fetched by Room ${roomId}:`, commandQueue[roomId]);
    delete commandQueue[roomId];
  } else {
    res.json({ command: null });
  }
});

// --- FRONTEND ENDPOINTS (REACT TALKS TO THESE) ---

// 3. React sends a command
app.post('/api/control', (req, res) => {
  const { cmd, roomId } = req.body; // Expect roomId if targeting specific room
  console.log(`Received Command from React: ${cmd} for Room: ${roomId || 'ALL'}`);

  if (roomId) {
    commandQueue[roomId] = cmd;
  } else {
    // Broadcast to all rooms (or handle as needed)
    roomsData.forEach((r) => {
      commandQueue[r.id] = cmd;
    });
  }

  res.status(200).send({ status: 'Command Queued' });
});

// 4. React asks for initial state on load
app.get('/api/status', (req, res) => {
  res.json(currentData);
});

app.get('/api/rooms', (req, res) => {
  res.json(roomsData);
});

// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ESP32 should point to http://<YOUR_PC_IP>:${PORT}/api/readings`);
});
