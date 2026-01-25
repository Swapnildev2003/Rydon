# 🚗 Transport Driver App

A modern, feature-rich mobile application built with **React Native** and **Expo** for transport drivers and conductors. This app enables real-time location tracking, booking management, and seamless communication with the backend transport management system.

---

## ✨ Features

### 🔐 Authentication
- **Multi-role Login** - Support for both Driver and Conductor roles
- **JWT Token Authentication** - Secure token-based authentication with refresh tokens
- **Persistent Sessions** - Auto-login using AsyncStorage for seamless user experience
- **Role-based Navigation** - Dynamic routing based on user role

### 🏠 Driver Dashboard
- **Vehicle Information Card** - Display assigned vehicle details (Bus/Car/Bike)
- **Driver Profile** - Show driver name and status
- **Balance Card** - View current balance and earnings
- **Statistics Row** - Quick overview of rides, ratings, and performance
- **Battery Status** - Real-time battery level monitoring with charging indicator
- **Connection Status** - WebSocket connection health indicator

### 🗺️ Real-Time Location Tracking
- **Live GPS Tracking** - Continuous location updates using `expo-location`
- **WebSocket Integration** - Real-time location streaming to backend
- **Background Location** - Support for background location updates
- **Location History** - Track and display location history

### 📋 Booking Management
- **View Bookings** - List of assigned bookings with details
- **Accept/Reject Bookings** - Quick actions to manage booking requests
- **Booking Map View** - Visualize pickup/drop-off locations on Google Maps
- **Pull-to-Refresh** - Easy refresh functionality for bookings list
- **Booking Status Updates** - Real-time status synchronization

### 🗺️ Maps Integration
- **Google Maps** - Native map integration for Android and iOS
- **Live Location Markers** - Show driver's current position
- **Booking Location Markers** - Display pickup and destination points
- **Custom Map Regions** - Dynamic map region calculations

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.79.5 |
| **Platform** | Expo SDK 54 |
| **Navigation** | Expo Router (File-based routing) |
| **State Management** | React Hooks |
| **HTTP Client** | Axios |
| **Storage** | AsyncStorage |
| **Maps** | React Native Maps + Google Maps API |
| **Location** | Expo Location |
| **Styling** | React Native StyleSheet |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Animations** | Lottie React Native |

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (app)/
│   │   ├── (driver)/
│   │   │   ├── components/       # Reusable UI components
│   │   │   │   ├── BalanceCard.jsx
│   │   │   │   ├── BookingCard.jsx
│   │   │   │   ├── BookingsList.jsx
│   │   │   │   ├── BottomNavigation.jsx
│   │   │   │   ├── ConnectionStatus.jsx
│   │   │   │   ├── DriverInfo.jsx
│   │   │   │   ├── LoadingError.jsx
│   │   │   │   ├── RidesMap.jsx
│   │   │   │   ├── StatsRow.jsx
│   │   │   │   ├── StatusBar.jsx
│   │   │   │   └── VehicleCard.jsx
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   │   ├── useBattery.js
│   │   │   │   ├── useBookings.js
│   │   │   │   ├── useDriverData.js
│   │   │   │   └── useLocationTracking.js
│   │   │   └── home.jsx          # Main driver home screen
│   │   └── (conductor)/          # Conductor-specific screens
│   ├── (auth)/
│   │   ├── login.jsx             # Login screen
│   │   ├── signup.jsx            # Registration screen
│   │   └── role.jsx              # Role selection screen
│   ├── _components/              # Shared components
│   │   ├── CustomButton.jsx
│   │   ├── CustomInput.jsx
│   │   ├── logoutButton.jsx
│   │   └── moreSection.jsx
│   └── index.jsx                 # App entry point with auth check
├── constants/
│   └── ApiConfig.js              # API endpoints configuration
├── hooks/                        # Global custom hooks
├── assets/                       # Images and static assets
├── app.json                      # Expo configuration
└── package.json                  # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Expo Go** app on your mobile device (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Transport-Management/mobile/Transport-Driver-App/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   
   Update the API configuration in `constants/ApiConfig.js`:
   ```javascript
   const API_CONFIG = {
     BASE_URL: 'http://YOUR_IP_ADDRESS:8000',
     WS_BASE_URL: 'ws://YOUR_IP_ADDRESS:8000',
     // ...
   };
   ```

   > **Finding your IP address:**
   > - **Windows:** Run `ipconfig` in Command Prompt
   > - **Mac/Linux:** Run `ifconfig | grep "inet "`

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator / `i` for iOS simulator

---

## 📱 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint for code quality |
| `npm run reset-project` | Reset to blank project |

---

## 🔌 API Integration

The app connects to a Django backend with the following endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /api/login/{role}/` | User authentication |
| `POST /api/signup/{role}/` | User registration |
| `GET /api/driver-details/{id}/` | Fetch driver profile |
| `GET /api/bookings/driver-id/` | Get driver's bookings |
| `GET /api/bus/driver/{id}/` | Get assigned bus |
| `GET /api/car/driver/{id}/` | Get assigned car |
| `GET /api/bike/driver/{id}/` | Get assigned bike |
| `WS /ws/bike/` | WebSocket for location updates |

---

## 🔑 Key Dependencies

```json
{
  "expo": "~54.0.29",
  "react-native": "0.79.5",
  "expo-router": "~5.1.5",
  "expo-location": "~18.1.6",
  "react-native-maps": "1.20.1",
  "axios": "^1.10.0",
  "@react-native-async-storage/async-storage": "2.1.2",
  "@react-native-community/netinfo": "11.4.1",
  "lottie-react-native": "7.2.2"
}
```

---

## 📋 Permissions

### Android
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`

### iOS
- Location When In Use
- Location Always (for background tracking)

---

## 🎨 UI Components

The app features a modular component architecture:

| Component | Purpose |
|-----------|---------|
| `BalanceCard` | Display driver's balance |
| `BookingCard` | Individual booking with actions |
| `BookingsList` | Scrollable list of bookings |
| `BottomNavigation` | Tab navigation (Home/Rides) |
| `ConnectionStatus` | WebSocket connection indicator |
| `DriverInfo` | Driver profile display |
| `RidesMap` | Interactive map with markers |
| `StatsRow` | Performance statistics |
| `StatusBar` | Battery and charging status |
| `VehicleCard` | Assigned vehicle details |

---

## 🔧 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useBattery` | Monitor device battery level |
| `useBookings` | Manage booking data and actions |
| `useDriverData` | Fetch and cache driver/vehicle info |
| `useLocationTracking` | GPS tracking with WebSocket streaming |

---

## 📝 License

This project is part of the Transport Management System.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions or issues, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using React Native & Expo**
