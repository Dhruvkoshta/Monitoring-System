import type { RoomSensorData } from 'src/_mock/_rooms';

import axios from 'axios';
import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import { Server, Activity, Droplets, Terminal, AlertTriangle } from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { _rooms } from 'src/_mock';
import { SENSOR_API_CONFIG } from 'src/config-sensor';
import { DashboardContent } from 'src/layouts/dashboard';

import { RoomCard } from '../room-card';
import { SensorMonitoringCard } from '../sensor-monitoring-card';

// ----------------------------------------------------------------------

const socket = io(SENSOR_API_CONFIG.API_URL, SENSOR_API_CONFIG.SOCKET_CONFIG);

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const theme = useTheme();

  const [data, setData] = useState({
    fire: false,
    flood: false,
    quake: false,
    floodLevel: 0,
    quakeIntensity: 0.0,
    rssi: 0,
    timestamp: Date.now(),
  });

  const [rooms, setRooms] = useState<RoomSensorData[]>(_rooms);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initial Fetch (REST API)
    axios
      .get(`${SENSOR_API_CONFIG.API_URL}/api/status`)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Fetch Error:', err));

    // Fetch Rooms
    axios
      .get(`${SENSOR_API_CONFIG.API_URL}/api/rooms`)
      .then((res) => setRooms(res.data))
      .catch((err) => console.error('Fetch Rooms Error:', err));

    // Real-time Listeners (Socket.io)
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sensor-update', (newData) => {
      console.log('Real-time Update:', newData);
      setData(newData);
    });

    socket.on('rooms-update', (newRooms) => {
      console.log('Rooms Update:', newRooms);
      setRooms(newRooms);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor-update');
      socket.off('rooms-update');
    };
  }, []);

  const sendCommand = async (cmd: string) => {
    try {
      await axios.post(`${SENSOR_API_CONFIG.API_URL}/api/control`, { cmd });
      alert(`Command '${cmd}' sent to server queue!`);
    } catch (err) {
      console.error('Command Failed:', err);
      alert('Failed to reach server.');
    }
  };

  const isAlarm = data.fire || data.flood || data.quake;

  // Calculate overall statistics from all rooms
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.isActive).length;
  const criticalRooms = rooms.filter((r) => r.status === 'critical').length;
  const warningRooms = rooms.filter((r) => r.status === 'warning').length;
  const roomsWithFire = rooms.filter((r) => r.fire).length;
  const roomsWithFlood = rooms.filter((r) => r.flood).length;
  const roomsWithQuake = rooms.filter((r) => r.quake).length;
  const hasAnyAlert = roomsWithFire > 0 || roomsWithFlood > 0 || roomsWithQuake > 0 || isAlarm;

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={{ xs: 3, md: 5 }}
        pb={2}
        borderBottom={1}
        borderColor="divider"
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Server size={32} color={theme.palette.primary.main} />
          <Typography variant="h4" fontWeight="bold">
            Sensor Monitoring System
          </Typography>
        </Box>

        <Card
          sx={{
            px: 2,
            py: 1,
            bgcolor: connected ? 'success.darker' : 'error.darker',
            color: connected ? 'success.lighter' : 'error.lighter',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: connected ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2" fontWeight="medium">
              {connected ? 'Socket Connected' : 'Socket Disconnected'}
            </Typography>
          </Box>
        </Card>
      </Box>

      <Grid container spacing={3}>
        {/* Main Status Card */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              p: 4,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: hasAnyAlert ? 'error.main' : 'divider',
              bgcolor: hasAnyAlert ? 'error.darker' : 'background.paper',
              transition: 'all 0.3s ease',
            }}
          >
            <Box textAlign="center">
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 2, fontSize: 14 }}
              >
                Overall System Status
              </Typography>
              <Typography
                variant="h2"
                fontWeight="bold"
                color={hasAnyAlert ? 'error.main' : 'success.main'}
                sx={{ my: 2 }}
              >
                {hasAnyAlert ? 'CRITICAL ALERT' : 'ALL SYSTEMS NORMAL'}
              </Typography>
              <Box display="flex" justifyContent="center" gap={4} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Total Rooms: {totalRooms}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active: {activeRooms}
                </Typography>
                {criticalRooms > 0 && (
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    Critical: {criticalRooms}
                  </Typography>
                )}
                {warningRooms > 0 && (
                  <Typography variant="body2" color="warning.main" fontWeight="bold">
                    Warning: {warningRooms}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Last Update: {new Date(data.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Overall Sensor Statistics */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Fire Detection"
            value={
              roomsWithFire > 0 || data.fire
                ? `${roomsWithFire + (data.fire ? 1 : 0)} DETECTED`
                : 'ALL CLEAR'
            }
            active={roomsWithFire > 0 || data.fire}
            icon={<AlertTriangle size={24} />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Flood Alerts"
            value={
              roomsWithFlood > 0 || data.flood
                ? `${roomsWithFlood + (data.flood ? 1 : 0)} ROOMS`
                : 'NO FLOODS'
            }
            active={roomsWithFlood > 0 || data.flood}
            icon={<Droplets size={24} />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Earthquake"
            value={
              roomsWithQuake > 0 || data.quake
                ? `${data.quakeIntensity.toFixed(1)} MAG`
                : 'NO ACTIVITY'
            }
            active={roomsWithQuake > 0 || data.quake}
            icon={<Activity size={24} />}
            color={theme.palette.secondary.main}
          />
        </Grid>

        {/* Rooms Section */}
        <Grid size={{ xs: 12 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              All Rooms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeRooms} of {totalRooms} rooms active
            </Typography>
          </Box>
        </Grid>

        {rooms.map((room) => (
          <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <RoomCard room={room} />
          </Grid>
        ))}

        {/* Control Panel */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Terminal size={20} />
              <Typography variant="h6" fontWeight="bold">
                Server Commands
              </Typography>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => sendCommand('RESET_ALARM')}
                sx={{ fontWeight: 'bold', minWidth: 150 }}
              >
                RESET ALARM
              </Button>
              <Button
                variant="contained"
                color="inherit"
                size="large"
                onClick={() => sendCommand('TEST_PING')}
                sx={{ fontWeight: 'bold', minWidth: 150 }}
              >
                PING NODE
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Commands are queued on the Node.js server. The ESP32 picks them up on its next poll
              cycle (every ~2s).
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
