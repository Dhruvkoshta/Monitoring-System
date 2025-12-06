const { sqliteTable, text, integer, real } = require('drizzle-orm/sqlite-core');

// Sensor Logs Table - stores all sensor readings
const sensorLogs = sqliteTable('sensor_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomId: text('room_id').notNull(),
  roomName: text('room_name').notNull(),
  location: text('location').notNull(),

  // Sensor readings
  fire: integer('fire', { mode: 'boolean' }).notNull().default(false),
  flood: integer('flood', { mode: 'boolean' }).notNull().default(false),
  quake: integer('quake', { mode: 'boolean' }).notNull().default(false),

  floodLevel: integer('flood_level').notNull().default(0),
  quakeIntensity: real('quake_intensity').notNull().default(0.0),
  temperature: real('temperature'),
  humidity: real('humidity'),
  rssi: integer('rssi').notNull(),

  // Status and metadata
  status: text('status', { enum: ['normal', 'warning', 'critical'] })
    .notNull()
    .default('normal'),
  eventType: text('event_type', { enum: ['heartbeat', 'alert', 'warning', 'critical'] }).notNull(),
  message: text('message'),

  // Timestamps
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Room Information Table
const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Alert Events Table - for critical events only
const alertEvents = sqliteTable('alert_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomId: text('room_id').notNull(),
  roomName: text('room_name').notNull(),
  alertType: text('alert_type', { enum: ['fire', 'flood', 'quake'] }).notNull(),
  severity: text('severity', { enum: ['warning', 'critical'] }).notNull(),
  value: real('value').notNull(), // flood level or quake intensity
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

module.exports = {
  sensorLogs,
  rooms,
  alertEvents,
};
