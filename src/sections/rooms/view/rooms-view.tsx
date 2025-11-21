import type { RoomSensorData } from 'src/_mock/_rooms';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { _rooms } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { RoomCard } from '../../overview/room-card';
import { RoomDetailsDialog } from '../room-details-dialog';

// ----------------------------------------------------------------------

export function RoomsView() {
  const [rooms, setRooms] = useState<RoomSensorData[]>(_rooms);
  const [selectedRoom, setSelectedRoom] = useState<RoomSensorData | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    location: '',
  });

  const handleAddRoom = () => {
    const room: RoomSensorData = {
      id: `${Date.now()}`,
      name: newRoom.name,
      location: newRoom.location,
      fire: false,
      flood: false,
      quake: false,
      floodLevel: 0,
      quakeIntensity: 0.0,
      rssi: -50,
      temperature: 22,
      humidity: 45,
      lastUpdate: Date.now(),
      status: 'normal',
      isActive: true,
    };

    setRooms([...rooms, room]);
    setOpenAddDialog(false);
    setNewRoom({ name: '', location: '' });
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter((r) => r.id !== roomId));
    setSelectedRoom(null);
  };

  const handleViewDetails = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
    }
  };

  const activeRooms = rooms.filter((r) => r.isActive).length;
  const criticalRooms = rooms.filter((r) => r.status === 'critical').length;
  const warningRooms = rooms.filter((r) => r.status === 'warning').length;

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Rooms Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage sensors across all rooms • {activeRooms}/{rooms.length} active
            {criticalRooms > 0 && ` • ${criticalRooms} critical`}
            {warningRooms > 0 && ` • ${warningRooms} warning`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Room
        </Button>
      </Box>

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <RoomCard room={room} onViewDetails={handleViewDetails} />
          </Grid>
        ))}

        {rooms.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                p: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No rooms added yet
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                Add your first room to start monitoring sensors
              </Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => setOpenAddDialog(true)}
              >
                Add Room
              </Button>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Room Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Room Name"
              fullWidth
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              placeholder="e.g., Living Room"
            />
            <TextField
              label="Location"
              fullWidth
              value={newRoom.location}
              onChange={(e) => setNewRoom({ ...newRoom, location: e.target.value })}
              placeholder="e.g., Ground Floor"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddRoom}
            variant="contained"
            disabled={!newRoom.name || !newRoom.location}
          >
            Add Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Details Dialog */}
      {selectedRoom && (
        <RoomDetailsDialog
          room={selectedRoom}
          open={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onDelete={handleDeleteRoom}
        />
      )}
    </DashboardContent>
  );
}
