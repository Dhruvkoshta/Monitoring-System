// ----------------------------------------------------------------------
// Sensor Monitoring System Configuration
// ----------------------------------------------------------------------

/**
 * API Configuration
 * Replace 'localhost' with your PC's IP address if testing on mobile
 * Example: 'http://192.168.1.100:5000'
 */
export const SENSOR_API_CONFIG = {
  API_URL: 'http://localhost:5000',
  
  // Socket.io Configuration
  SOCKET_CONFIG: {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  },
  
  // Polling interval (milliseconds)
  POLL_INTERVAL: 2000,
} as const;
