import type { RoomSensorData } from 'src/_mock/_rooms';

import {
  MapPin,
  Signal,
  Trash2,
  Activity,
  Droplets,
  Thermometer,
  AlertTriangle,
} from 'lucide-react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type RoomDetailsDialogProps = {
  room: RoomSensorData;
  open: boolean;
  onClose: () => void;
  onDelete: (roomId: string) => void;
};

export function RoomDetailsDialog({ room, open, onClose, onDelete }: RoomDetailsDialogProps) {
  const theme = useTheme();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${room.name}?`)) {
      onDelete(room.id);
    }
  };

  const statusColor =
    room.status === 'critical'
      ? theme.palette.error.main
      : room.status === 'warning'
        ? theme.palette.warning.main
        : theme.palette.success.main;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {room.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
              <MapPin size={16} />
              <Typography variant="body2">{room.location}</Typography>
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
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Sensor Status */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Sensor Status
          </Typography>
          <Box display="flex" gap={1} mb={3} flexWrap="wrap">
            <Chip
              icon={<AlertTriangle size={14} />}
              label={room.fire ? 'FIRE DETECTED' : 'No Fire'}
              size="small"
              color={room.fire ? 'error' : 'default'}
              variant={room.fire ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<Droplets size={14} />}
              label={room.flood ? `FLOOD ${room.floodLevel}%` : `Flood ${room.floodLevel}%`}
              size="small"
              color={room.flood ? 'info' : 'default'}
              variant={room.flood ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<Activity size={14} />}
              label={room.quake ? `QUAKE ${room.quakeIntensity}` : 'No Earthquake'}
              size="small"
              color={room.quake ? 'secondary' : 'default'}
              variant={room.quake ? 'filled' : 'outlined'}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Environmental Data */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Environmental Data
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {room.temperature !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                    textAlign: 'center',
                  }}
                >
                  <Thermometer size={24} color={theme.palette.text.secondary} />
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                    {room.temperature}°C
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Temperature
                  </Typography>
                </Box>
              </Grid>
            )}
            {room.humidity !== undefined && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                    textAlign: 'center',
                  }}
                >
                  <Droplets size={24} color={theme.palette.text.secondary} />
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                    {room.humidity}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Humidity
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  textAlign: 'center',
                }}
              >
                <Signal size={24} color={theme.palette.text.secondary} />
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                  {room.rssi} dBm
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Signal
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  textAlign: 'center',
                }}
              >
                <Activity size={24} color={theme.palette.text.secondary} />
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                  {room.isActive ? 'Active' : 'Inactive'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* System Info */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            System Information
          </Typography>
          <Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2" color="text.secondary">
                Room ID
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {room.id}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2" color="text.secondary">
                Last Update
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {new Date(room.lastUpdate).toLocaleString()}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2" color="text.secondary">
                Flood Level
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {room.floodLevel}%
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography variant="body2" color="text.secondary">
                Quake Intensity
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {room.quakeIntensity.toFixed(1)} Magnitude
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleDelete}
          startIcon={<Trash2 size={16} />}
          color="error"
          variant="outlined"
        >
          Delete Room
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
