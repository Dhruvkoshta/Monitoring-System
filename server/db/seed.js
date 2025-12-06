const { dbOperations, initDatabase } = require('./index');

// Mock room data
const mockRooms = [
  { id: '1', name: 'Living Room', location: 'Ground Floor' },
  { id: '2', name: 'Kitchen', location: 'Ground Floor' },
  { id: '3', name: 'Master Bedroom', location: 'First Floor' },
  { id: '4', name: 'Basement', location: 'Basement' },
  { id: '5', name: 'Garage', location: 'Ground Floor' },
];

// Generate random sensor data
function generateRandomLog(roomIndex, daysAgo = 0) {
  const room = mockRooms[roomIndex % mockRooms.length];
  const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  // Random event scenarios with weights
  const rand = Math.random();
  let scenario;

  if (rand < 0.7) {
    // 70% normal
    scenario = {
      fire: false,
      flood: false,
      quake: false,
      status: 'normal',
      eventType: 'heartbeat',
      message: `Normal reading from ${room.name}`,
    };
  } else if (rand < 0.8) {
    // 10% warning
    scenario = {
      fire: false,
      flood: false,
      quake: false,
      status: 'warning',
      eventType: 'warning',
      message: `Temperature warning in ${room.name}`,
    };
  } else if (rand < 0.85) {
    // 5% fire
    scenario = {
      fire: true,
      flood: false,
      quake: false,
      status: 'critical',
      eventType: 'critical',
      message: `🔥 FIRE DETECTED in ${room.name}`,
    };
  } else if (rand < 0.925) {
    // 7.5% flood
    scenario = {
      fire: false,
      flood: true,
      quake: false,
      status: 'critical',
      eventType: 'alert',
      message: `💧 FLOOD detected in ${room.name}`,
    };
  } else {
    // 7.5% quake
    scenario = {
      fire: false,
      flood: false,
      quake: true,
      status: 'critical',
      eventType: 'critical',
      message: `🌊 EARTHQUAKE detected in ${room.name}`,
    };
  }

  return {
    roomId: room.id,
    roomName: room.name,
    location: room.location,
    fire: scenario.fire,
    flood: scenario.flood,
    quake: scenario.quake,
    floodLevel: scenario.flood ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 30),
    quakeIntensity: scenario.quake ? parseFloat((Math.random() * 8).toFixed(1)) : 0.0,
    temperature: parseFloat((18 + Math.random() * 14).toFixed(1)),
    humidity: Math.floor(35 + Math.random() * 40),
    rssi: Math.floor(-85 + Math.random() * 45),
    status: scenario.status,
    eventType: scenario.eventType,
    message: scenario.message,
    timestamp: timestamp,
    createdAt: new Date(),
  };
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Initialize database
    initDatabase();

    // Insert rooms
    console.log('📍 Inserting rooms...');
    for (const room of mockRooms) {
      await dbOperations.upsertRoom({
        ...room,
        description: `${room.name} in ${room.location}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✓ Room: ${room.name}`);
    }

    // Insert 10 mock sensor logs
    console.log('\n📊 Inserting 10 sensor logs...');
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 7); // Random logs from past week
      const log = generateRandomLog(i, daysAgo);
      await dbOperations.insertSensorLog(log);
      console.log(`  ✓ Log ${i + 1}: ${log.roomName} - ${log.eventType} (${log.status})`);
    }

    // Insert some alert events
    console.log('\n🚨 Inserting alert events...');
    const criticalLogs = [];
    for (let i = 0; i < 3; i++) {
      const room = mockRooms[i];
      const alertTypes = ['fire', 'flood', 'quake'];
      const alertType = alertTypes[i % 3];

      const alert = {
        roomId: room.id,
        roomName: room.name,
        alertType: alertType,
        severity: 'critical',
        value: alertType === 'flood' ? 75 : alertType === 'quake' ? 6.5 : 1,
        resolved: i === 2, // Last one resolved
        resolvedAt: i === 2 ? new Date(Date.now() - 1 * 60 * 60 * 1000) : null,
        timestamp: new Date(Date.now() - (i + 1) * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      await dbOperations.insertAlertEvent(alert);
      console.log(
        `  ✓ Alert: ${alert.roomName} - ${alert.alertType} (${alert.severity}${alert.resolved ? ' - RESOLVED' : ''})`
      );
    }

    // Display statistics
    console.log('\n📈 Database Statistics:');
    const stats = await dbOperations.getLogStats();
    console.log(`  Total Logs: ${stats.total}`);
    console.log(`  Critical: ${stats.critical}`);
    console.log(`  Warning: ${stats.warning}`);
    console.log(`  Normal: ${stats.normal}`);

    const activeAlerts = await dbOperations.getActiveAlerts();
    console.log(`  Active Alerts: ${activeAlerts.length}`);

    const recentLogs = await dbOperations.getSensorLogs(5);
    console.log('\n📝 Most Recent Logs:');
    recentLogs.forEach((log, idx) => {
      const date = new Date(log.timestamp);
      console.log(`  ${idx + 1}. ${log.roomName} - ${log.eventType} - ${date.toLocaleString()}`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n💡 View logs at: http://localhost:3040/logs\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
