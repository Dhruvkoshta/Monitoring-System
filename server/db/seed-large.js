const { dbOperations, initDatabase } = require('./index');

// Mock room data
const mockRooms = [
  { id: '1', name: 'Living Room', location: 'Ground Floor' },
  { id: '2', name: 'Kitchen', location: 'Ground Floor' },
  { id: '3', name: 'Master Bedroom', location: 'First Floor' },
  { id: '4', name: 'Guest Room', location: 'First Floor' },
  { id: '5', name: 'Basement', location: 'Basement' },
  { id: '6', name: 'Garage', location: 'Ground Floor' },
  { id: '7', name: 'Office', location: 'First Floor' },
  { id: '8', name: 'Bathroom', location: 'Ground Floor' },
];

function generateRandomLog(roomIndex, daysAgo = 0, hoursAgo = 0) {
  const room = mockRooms[roomIndex % mockRooms.length];
  const timestamp = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000
  );

  const rand = Math.random();
  let scenario;

  if (rand < 0.7) {
    scenario = {
      fire: false,
      flood: false,
      quake: false,
      status: 'normal',
      eventType: 'heartbeat',
      message: `Normal reading from ${room.name}`,
    };
  } else if (rand < 0.85) {
    scenario = {
      fire: false,
      flood: false,
      quake: false,
      status: 'warning',
      eventType: 'warning',
      message: `Temperature/humidity warning in ${room.name}`,
    };
  } else if (rand < 0.9) {
    scenario = {
      fire: true,
      flood: false,
      quake: false,
      status: 'critical',
      eventType: 'critical',
      message: `🔥 FIRE DETECTED in ${room.name}`,
    };
  } else if (rand < 0.95) {
    scenario = {
      fire: false,
      flood: true,
      quake: false,
      status: 'critical',
      eventType: 'alert',
      message: `💧 FLOOD ${Math.floor(Math.random() * 100)}% in ${room.name}`,
    };
  } else {
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

async function seedLargeDatabase() {
  try {
    console.log('🌱 Starting large database seeding...\n');

    initDatabase();

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

    console.log('\n📊 Inserting 100 sensor logs...');
    const logsToInsert = 100;

    for (let i = 0; i < logsToInsert; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // Past 30 days
      const hoursAgo = Math.floor(Math.random() * 24);
      const log = generateRandomLog(i, daysAgo, hoursAgo);
      await dbOperations.insertSensorLog(log);

      if ((i + 1) % 20 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/${logsToInsert} logs...`);
      }
    }

    console.log('\n🚨 Inserting alert events...');
    const alertCount = 20;

    for (let i = 0; i < alertCount; i++) {
      const room = mockRooms[i % mockRooms.length];
      const alertTypes = ['fire', 'flood', 'quake'];
      const severities = ['critical', 'warning'];
      const daysAgo = Math.floor(Math.random() * 14);

      const alert = {
        roomId: room.id,
        roomName: room.name,
        alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        value: parseFloat((Math.random() * 100).toFixed(2)),
        resolved: Math.random() > 0.4, // 60% resolved
        resolvedAt:
          Math.random() > 0.4
            ? new Date(
                Date.now() - daysAgo * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000
              )
            : null,
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      await dbOperations.insertAlertEvent(alert);
    }
    console.log(`  ✓ Inserted ${alertCount} alert events`);

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

    console.log('\n✅ Large database seeding completed successfully!');
    console.log('\n💡 View logs at: http://localhost:3040/logs\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedLargeDatabase();
