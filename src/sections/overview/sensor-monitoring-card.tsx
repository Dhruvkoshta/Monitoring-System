import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type SensorMonitoringCardProps = CardProps & {
  label: string;
  value: string;
  active: boolean;
  icon: React.ReactNode;
  color: string;
};

export function SensorMonitoringCard({
  label,
  value,
  active,
  icon,
  color,
  sx,
  ...other
}: SensorMonitoringCardProps) {
  return (
    <Card
      sx={{
        p: 3,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: active ? color : 'divider',
        bgcolor: active ? `${color}08` : 'background.neutral',
        ...sx,
      }}
      {...other}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold" color={active ? color : 'text.secondary'}>
          {label}
        </Typography>
        <Box color={active ? color : 'text.secondary'}>{icon}</Box>
      </Box>
      <Typography variant="h3" fontWeight="bold" color={active ? color : 'text.secondary'}>
        {value}
      </Typography>
    </Card>
  );
}
