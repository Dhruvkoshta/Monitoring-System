// ----------------------------------------------------------------------
// Room Data Types and Mock Data
// ----------------------------------------------------------------------

export type RoomSensorData = {
  id: string;
  name: string;
  location: string;
  fire: boolean;
  flood: boolean;
  quake: boolean;
  floodLevel: number;
  quakeIntensity: number;
  rssi: number;
  temperature?: number;
  humidity?: number;
  lastUpdate: number;
  status: 'normal' | 'warning' | 'critical';
  isActive: boolean;
};

// Mock data for rooms - In production, this would come from your API
export const _rooms: RoomSensorData[] = [
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
];
