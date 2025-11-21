import type { RoomSensorData } from 'src/_mock/_rooms';

import { useState, useCallback } from 'react';
import { Server, Activity, Droplets, Terminal, AlertTriangle, Usb } from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { _rooms } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { RoomCard } from '../room-card';
import { SensorMonitoringCard } from '../sensor-monitoring-card';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const theme = useTheme();

  const [rooms, setRooms] = useState<RoomSensorData[]>(_rooms);
  const [serialConnected, setSerialConnected] = useState(false);
  const [port, setPort] = useState<SerialPort | null>(null);

  const handleSerialData = useCallback((data: any) => {
    console.log('Serial Data:', data);
    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === data.id ? { ...room, ...data, isActive: true, timestamp: Date.now() } : room
      )
    );
  }, []);

  const connectToSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API not supported in this browser.');
      return;
    }

    try {
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 115200 });

      setPort(serialPort);
      setSerialConnected(true);

      const reader = serialPort.readable?.getReader();
      if (!reader) {
        throw new Error('Cannot get reader from serial port.');
      }

      let buffer = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        const text = new TextDecoder().decode(value);
        buffer += text;

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep the last, possibly incomplete, line

        for (const line of lines) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            try {
              const jsonData = JSON.parse(line.trim());
              handleSerialData(jsonData);
            } catch (e) {
              console.error('Error parsing JSON from serial:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error connecting to serial port:', err);
      setSerialConnected(false);
    }
  };

  const disconnectFromSerial = async () => {
    if (port?.readable) {
      try {
        const reader = port.readable.getReader();
        await reader.cancel();
      } catch {
        // Ignore errors if the port is already closing
      }
    }
    await port?.close();
    setPort(null);
    setSerialConnected(false);
  };

  // Calculate overall statistics from all rooms
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.isActive).length;
  const criticalRooms = rooms.filter((r) => r.fire || r.flood || r.quake).length;
  const warningRooms = rooms.filter((r) => r.status === 'warning').length;
  const roomsWithFire = rooms.filter((r) => r.fire).length;
  const roomsWithFlood = rooms.filter((r) => r.flood).length;
  const roomsWithQuake = rooms.filter((r) => r.quake).length;
  const hasAnyAlert = roomsWithFire > 0 || roomsWithFlood > 0 || roomsWithQuake > 0;

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

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Usb />}
            color={serialConnected ? 'success' : 'primary'}
            onClick={serialConnected ? disconnectFromSerial : connectToSerial}
          >
            {serialConnected ? 'Disconnect' : 'Connect to Device'}
          </Button>
        </Box>
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
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Overall Sensor Statistics */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Fire Detection"
            value={roomsWithFire > 0 ? `${roomsWithFire} DETECTED` : 'ALL CLEAR'}
            active={roomsWithFire > 0}
            icon={<AlertTriangle size={24} />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Flood Alerts"
            value={roomsWithFlood > 0 ? `${roomsWithFlood} ROOMS` : 'NO FLOODS'}
            active={roomsWithFlood > 0}
            icon={<Droplets size={24} />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SensorMonitoringCard
            label="Earthquake"
            value={roomsWithQuake > 0 ? 'ACTIVITY DETECTED' : 'NO ACTIVITY'}
            active={roomsWithQuake > 0}
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

        {/* Control Panel - Disabled for Serial version */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3, opacity: 0.5 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Terminal size={20} />
              <Typography variant="h6" fontWeight="bold">
                Server Commands (Disabled)
              </Typography>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button variant="contained" color="primary" size="large" disabled>
                RESET ALARM
              </Button>
              <Button variant="contained" color="inherit" size="large" disabled>
                PING NODE
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Direct serial connection does not use the server for commands.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
