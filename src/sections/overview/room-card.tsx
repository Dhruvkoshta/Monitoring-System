import type { CardProps } from '@mui/material/Card';
import type { RoomSensorData } from 'src/_mock/_rooms';

import { MapPin, Signal, Activity, Droplets, Thermometer, AlertTriangle } from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type RoomCardProps = CardProps & {
  room: RoomSensorData;
  onViewDetails?: (roomId: string) => void;
};

export function RoomCard({ room, onViewDetails, sx, ...other }: RoomCardProps) {
  const theme = useTheme();

  const hasAlert = room.fire || room.flood || room.quake;
  const statusColor =
    room.status === 'critical'
      ? theme.palette.error.main
      : room.status === 'warning'
        ? theme.palette.warning.main
        : theme.palette.success.main;

  return (
    <Card
      sx={{
        p: 3,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: hasAlert ? 'error.main' : 'divider',
        bgcolor: hasAlert ? 'error.darker' : 'background.paper',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        ...sx,
      }}
      onClick={() => onViewDetails?.(room.id)}
      {...other}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {room.name}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <MapPin size={14} />
            <Typography variant="caption">{room.location}</Typography>
          </Box>
        </Box>
        <Chip
          label={room.status.toUpperCase()}
          size="small"
          sx={{
            bgcolor: `${statusColor}22`,
            color: statusColor,
            fontWeight: 'bold',
          }}
        />
      </Box>

      {/* Sensor Status */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {room.fire && (
          <Chip
            icon={<AlertTriangle size={14} />}
            label="FIRE"
            size="small"
            color="error"
            variant="filled"
          />
        )}
        {room.flood && (
          <Chip
            icon={<Droplets size={14} />}
            label={`FLOOD ${room.floodLevel}%`}
            size="small"
            color="info"
            variant="filled"
          />
        )}
        {room.quake && (
          <Chip
            icon={<Activity size={14} />}
            label={`QUAKE ${room.quakeIntensity}`}
            size="small"
            color="secondary"
            variant="filled"
          />
        )}
      </Box>

      {/* Metrics */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={2}>
          {room.temperature !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Thermometer size={16} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                {room.temperature}°C
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center" gap={0.5}>
            <Signal size={16} color={theme.palette.text.secondary} />
            <Typography variant="body2" color="text.secondary">
              {room.rssi} dBm
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.disabled">
          {new Date(room.lastUpdate).toLocaleTimeString()}
        </Typography>
      </Box>
    </Card>
  );
}
