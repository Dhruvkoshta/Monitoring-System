const { drizzle } = require('drizzle-orm/better-sqlite3');
const { eq, desc, and, gte, lte, like, or } = require('drizzle-orm');
const path = require('path');
const Database = require('better-sqlite3');
const schema = require('./schema');

// Initialize SQLite database
const sqlite = new Database(path.join(__dirname, '../monitoring.db'));
const db = drizzle(sqlite, { schema });

// Initialize tables
function initDatabase() {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sensor_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        room_name TEXT NOT NULL,
        location TEXT NOT NULL,
        fire INTEGER NOT NULL DEFAULT 0,
        flood INTEGER NOT NULL DEFAULT 0,
        quake INTEGER NOT NULL DEFAULT 0,
        flood_level INTEGER NOT NULL DEFAULT 0,
        quake_intensity REAL NOT NULL DEFAULT 0.0,
        temperature REAL,
        humidity REAL,
        rssi INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'normal',
        event_type TEXT NOT NULL,
        message TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alert_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        room_name TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        value REAL NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        resolved_at INTEGER,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sensor_logs_room_id ON sensor_logs(room_id);
      CREATE INDEX IF NOT EXISTS idx_sensor_logs_timestamp ON sensor_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sensor_logs_event_type ON sensor_logs(event_type);
      CREATE INDEX IF NOT EXISTS idx_alert_events_room_id ON alert_events(room_id);
      CREATE INDEX IF NOT EXISTS idx_alert_events_resolved ON alert_events(resolved);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Database operations
const dbOperations = {
  // Sensor Logs
  async insertSensorLog(log) {
    return db.insert(schema.sensorLogs).values(log).returning();
  },

  async getSensorLogs(limit = 100, offset = 0) {
    return db
      .select()
      .from(schema.sensorLogs)
      .orderBy(desc(schema.sensorLogs.timestamp))
      .limit(limit)
      .offset(offset);
  },

  async getSensorLogsByRoom(roomId, limit = 50) {
    return db
      .select()
      .from(schema.sensorLogs)
      .where(eq(schema.sensorLogs.roomId, roomId))
      .orderBy(desc(schema.sensorLogs.timestamp))
      .limit(limit);
  },

  async getSensorLogsByDateRange(startDate, endDate) {
    return db
      .select()
      .from(schema.sensorLogs)
      .where(
        and(gte(schema.sensorLogs.timestamp, startDate), lte(schema.sensorLogs.timestamp, endDate))
      )
      .orderBy(desc(schema.sensorLogs.timestamp));
  },

  async searchSensorLogs(searchTerm, filters = {}) {
    const conditions = [];

    if (searchTerm) {
      conditions.push(
        or(
          like(schema.sensorLogs.roomName, `%${searchTerm}%`),
          like(schema.sensorLogs.location, `%${searchTerm}%`),
          like(schema.sensorLogs.message, `%${searchTerm}%`)
        )
      );
    }

    if (filters.roomId) {
      conditions.push(eq(schema.sensorLogs.roomId, filters.roomId));
    }

    if (filters.eventType) {
      conditions.push(eq(schema.sensorLogs.eventType, filters.eventType));
    }

    if (filters.status) {
      conditions.push(eq(schema.sensorLogs.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(gte(schema.sensorLogs.timestamp, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(schema.sensorLogs.timestamp, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(schema.sensorLogs)
      .where(whereClause)
      .orderBy(desc(schema.sensorLogs.timestamp))
      .limit(500);
  },

  // Rooms
  async upsertRoom(room) {
    const existing = await db.select().from(schema.rooms).where(eq(schema.rooms.id, room.id));

    if (existing.length > 0) {
      return db
        .update(schema.rooms)
        .set({ ...room, updatedAt: new Date() })
        .where(eq(schema.rooms.id, room.id))
        .returning();
    } else {
      return db.insert(schema.rooms).values(room).returning();
    }
  },

  async getAllRooms() {
    return db.select().from(schema.rooms);
  },

  // Alert Events
  async insertAlertEvent(alert) {
    return db.insert(schema.alertEvents).values(alert).returning();
  },

  async getActiveAlerts() {
    return db
      .select()
      .from(schema.alertEvents)
      .where(eq(schema.alertEvents.resolved, false))
      .orderBy(desc(schema.alertEvents.timestamp));
  },

  async resolveAlert(alertId) {
    return db
      .update(schema.alertEvents)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(eq(schema.alertEvents.id, alertId))
      .returning();
  },

  async getRecentAlerts(limit = 50) {
    return db
      .select()
      .from(schema.alertEvents)
      .orderBy(desc(schema.alertEvents.timestamp))
      .limit(limit);
  },

  // Statistics
  async getLogStats() {
    const totalLogs = await db.select().from(schema.sensorLogs);
    const criticalLogs = await db
      .select()
      .from(schema.sensorLogs)
      .where(eq(schema.sensorLogs.status, 'critical'));
    const warningLogs = await db
      .select()
      .from(schema.sensorLogs)
      .where(eq(schema.sensorLogs.status, 'warning'));

    return {
      total: totalLogs.length,
      critical: criticalLogs.length,
      warning: warningLogs.length,
      normal: totalLogs.length - criticalLogs.length - warningLogs.length,
    };
  },
};

module.exports = {
  db,
  initDatabase,
  dbOperations,
  schema,
};
