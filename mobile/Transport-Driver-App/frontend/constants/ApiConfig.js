// API Configuration for Mobile App
// Change this IP address to match your development machine's IP

// To find your IP address:
// Windows: Open Command Prompt and run: ipconfig
// Look for "IPv4 Address" under your network adapter
// Mac/Linux: Open Terminal and run: ifconfig | grep "inet "

const API_CONFIG = {
  // Your computer's IP address - Updated automatically
  BASE_URL: 'http://192.168.29.6:8000',  // Your current IP address
  WS_BASE_URL: 'ws://192.168.29.6:8000',  // Your current IP address
  
  // API endpoints
  ENDPOINTS: {
    LOGIN: (role) => `/api/login/${role}/`,
    SIGNUP: (role) => `/api/signup/${role}/`,
    DRIVER_DETAILS: (driverId) => `/api/driver-details/${driverId}/`,
    DRIVER_BOOKINGS: (driverId) => `/api/bookings/driver-id/?driver_id=${parseInt(driverId)}`,
    VEHICLE_BY_DRIVER: {
      BUS: (driverId) => `/api/bus/driver/${driverId}/`,
      CAR: (driverId) => `/api/car/driver/${driverId}/`,
      BIKE: (driverId) => `/api/bike/driver/${driverId}/`
    },
    WEBSOCKET: {
      BIKE: '/ws/bike/'
    }
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWsUrl = (endpoint) => {
  return `${API_CONFIG.WS_BASE_URL}${endpoint}`;
};

export default API_CONFIG;