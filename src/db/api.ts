import type { LogStats, SensorLog, AlertEvent, LogFilters } from './types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

// Sensor Logs API
export const sensorLogsApi = {
  async getAll(limit = 100, offset = 0): Promise<SensorLog[]> {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}&offset=${offset}`);
    return handleResponse<SensorLog[]>(response);
  },

  async getByRoom(roomId: string, limit = 50): Promise<SensorLog[]> {
    const response = await fetch(`${API_BASE_URL}/logs/room/${roomId}?limit=${limit}`);
    return handleResponse<SensorLog[]>(response);
  },

  async search(searchTerm: string, filters?: LogFilters): Promise<SensorLog[]> {
    const params = new URLSearchParams();
    params.append('search', searchTerm);
    
    if (filters?.roomId) params.append('roomId', filters.roomId);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/logs/search?${params.toString()}`);
    return handleResponse<SensorLog[]>(response);
  },

  async getStats(): Promise<LogStats> {
    const response = await fetch(`${API_BASE_URL}/logs/stats`);
    return handleResponse<LogStats>(response);
  },

  async create(log: Omit<SensorLog, 'id' | 'createdAt'>): Promise<SensorLog> {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return handleResponse<SensorLog>(response);
  },
};

// Alert Events API
export const alertEventsApi = {
  async getActive(): Promise<AlertEvent[]> {
    const response = await fetch(`${API_BASE_URL}/alerts/active`);
    return handleResponse<AlertEvent[]>(response);
  },

  async getRecent(limit = 50): Promise<AlertEvent[]> {
    const response = await fetch(`${API_BASE_URL}/alerts/recent?limit=${limit}`);
    return handleResponse<AlertEvent[]>(response);
  },

  async resolve(alertId: number): Promise<AlertEvent> {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
      method: 'PATCH',
    });
    return handleResponse<AlertEvent>(response);
  },
};

// Room API
export const roomsApi = {
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    return handleResponse(response);
  },
};
