import { useState, useEffect, useCallback } from 'react';

import { sensorLogsApi, alertEventsApi } from './api';

import type { LogStats, SensorLog, AlertEvent, LogFilters } from './types';

// Hook for fetching sensor logs with filters and search
export function useSensorLogs(initialFilters?: LogFilters) {
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>(initialFilters || {});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sensorLogsApi.search(searchTerm, filters);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    refetch: fetchLogs,
  };
}

// Hook for fetching logs by room
export function useRoomLogs(roomId: string, limit = 50) {
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await sensorLogsApi.getByRoom(roomId, limit);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room logs');
    } finally {
      setLoading(false);
    }
  }, [roomId, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}

// Hook for log statistics
export function useLogStats() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sensorLogsApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook for active alerts
export function useActiveAlerts() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertEventsApi.getActive();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: number) => {
    try {
      await alertEventsApi.resolve(alertId);
      await fetchAlerts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  }, [fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts, resolveAlert };
}

// Hook for creating sensor logs
export function useCreateSensorLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLog = useCallback(async (log: Omit<SensorLog, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await sensorLogsApi.create(log);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create log';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { createLog, loading, error };
}
