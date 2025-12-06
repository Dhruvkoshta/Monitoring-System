// Types matching the backend schema
export interface SensorLog {
  id: number;
  roomId: string;
  roomName: string;
  location: string;
  fire: boolean;
  flood: boolean;
  quake: boolean;
  floodLevel: number;
  quakeIntensity: number;
  temperature?: number;
  humidity?: number;
  rssi: number;
  status: 'normal' | 'warning' | 'critical';
  eventType: 'heartbeat' | 'alert' | 'warning' | 'critical';
  message?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertEvent {
  id: number;
  roomId: string;
  roomName: string;
  alertType: 'fire' | 'flood' | 'quake';
  severity: 'warning' | 'critical';
  value: number;
  resolved: boolean;
  resolvedAt?: Date;
  timestamp: Date;
  createdAt: Date;
}

export interface LogFilters {
  roomId?: string;
  eventType?: 'heartbeat' | 'alert' | 'warning' | 'critical';
  status?: 'normal' | 'warning' | 'critical';
  startDate?: Date;
  endDate?: Date;
}

export interface LogStats {
  total: number;
  critical: number;
  warning: number;
  normal: number;
}
