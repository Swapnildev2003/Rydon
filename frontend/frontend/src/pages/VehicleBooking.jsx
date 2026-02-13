import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaCar,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaUser,
  FaCheckCircle,
  FaTimes,
  FaSnowflake,
  FaWifi,
  FaLocationArrow
} from "react-icons/fa";
import { GoogleMap, Marker, InfoWindow, Data } from "@react-google-maps/api";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VehicleBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    fromCity = "",
    toCity = "",
    departureDate = "",
    selectedService = "car",
    vehicleType = "",
    user_id = ''
  } = location.state || {};

  // State management
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState("");
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    message: ""
  });

  // Service type icon mapping
  const serviceIcons = {
    car: <FaCar className="text-blue-600" />,
    bike: <FaMotorcycle className="text-green-600" />
  };

  const serviceIconUrls = {
    car: 'https://cdn-icons-png.flaticon.com/512/3079/3079026.png',
    bike: 'https://cdn-icons-png.flaticon.com/512/2745/2745697.png'
  };

  const serviceColors = {
    car: 'bg-blue-100 text-blue-600',
    bike: 'bg-green-100 text-green-600'
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Book a specific vehicle
  // Book all vehicles (modified from bookNearestVehicle)
  const bookNearestVehicle = async () => {
    if (vehicles.length === 0) return;

    setBookingStatus({
      loading: true,
      message: "Sending booking requests to all available vehicles..."
    });

    try {
      // Create an array of booking promises for all vehicles
      const bookingPromises = vehicles.map(vehicle => {
        const bookingData = {
          user: user_id,
          driver: vehicle.driver,
          from_address: fromCity,
          to_address: toCity,
        };
        return axios.post(
          'http://localhost:8000/api/bookings/create/',
          bookingData
        );
      });

      // Wait for all booking requests to complete
      const responses = await Promise.all(bookingPromises);

      // Filter successful responses
      const successfulBookings = responses.filter(response => response.status === 201);

      if (successfulBookings.length > 0) {
        // Navigate with the first successful booking
        navigate('/booking-confirmation', {
          state: {
            booking: successfulBookings[0].data,
            vehicle: vehicles[0], // Using first vehicle for confirmation
            fromCity,
            toCity,
            totalBookings: successfulBookings.length,
            selectedService
          }
        });
      } else {
        setBookingStatus({
          loading: false,
          message: "No bookings were successful. Please try again."
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus({
        loading: false,
        message: error.response?.data?.message || "Some bookings failed. Please try again."
      });
    }
  };
  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({
            lat: latitude,
            lng: longitude
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocation({ lat: 26.7605545, lng: 83.3731675 });
        }
      );
    } else {
      setUserLocation({ lat: 26.7605545, lng: 83.3731675 });
    }
  }, []);

  // Fetch vehicle details from API
  const fetchVehicleDetails = async (vehicleId) => {
    try {
      const endpoint = selectedService === 'car'
        ? `http://localhost:8000/api/car/driver/${vehicleId}/`
        : `http://localhost:8000/api/bike/driver/${vehicleId}/`;

      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      return null;
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!userLocation) return;

    const WS_URL = 'ws://localhost:8000/ws/bike/';
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({
        type: 'subscribe',
        vehicle_type: selectedService,
        update_interval: 2000
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket data:", data)

        if (data.type === 'batch_location_update' && Array.isArray(data.data)) {
          // First filter by selected service type
          const serviceVehicles = data.data.filter(item => item.vehicle_type === selectedService);
          console.log("Filtered vehicles:", serviceVehicles, "selectedService:", selectedService);
          setLiveVehicles(serviceVehicles);

          const vehiclesWithDetails = await Promise.all(
            serviceVehicles.map(async (vehicle) => {
              const details = await fetchVehicleDetails(vehicle.id);
              console.log("Vehicle details for id", vehicle.id, ":", details);
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                vehicle.latitude,
                vehicle.longitude
              );

              return {
                user_id,
                ...vehicle,
                ...(details || {}),
                toCity,
                fromCity,
                position: { lat: vehicle.latitude, lng: vehicle.longitude },
                vehicleSubType: selectedService === 'car' ? (details?.car_type || '') : (details?.bike_type || ''),
                distanceFromUser: distance,
                isLive: true
              };
            })
          );

          console.log("vehiclesWithDetails:", vehiclesWithDetails);

          // Filter by the vehicle type passed from RideNowUI (if specified)
          const filteredByType = vehicleType
            ? vehiclesWithDetails.filter(v => {
              // vehicle_type from API contains the sub-type (SUV, Sedan, Sport, etc.)
              const vType = (v.vehicle_type || '').toLowerCase();
              return vType === vehicleType.toLowerCase();
            })
            : vehiclesWithDetails;

          console.log("filteredByType:", filteredByType, "vehicleType filter:", vehicleType);

          // Sort by distance
          const sortedVehicles = [...filteredByType].sort((a, b) =>
            a.distanceFromUser - b.distanceFromUser
          );
          console.log("Final vehicles:", sortedVehicles);
          setVehicles(sortedVehicles);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      setConnectionStatus('error');
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    return () => ws.close();
  }, [selectedService, userLocation, vehicleType]);

  // Calculate ETA
  useEffect(() => {
    setDuration(`${Math.round(distance * 3)} mins`);
  }, [distance]);

  // Handler functions
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveMarker(vehicle.id);
    if (userLocation && vehicle.position) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        vehicle.position.lat,
        vehicle.position.lng
      );
      setDistance(dist);
    }
  };

  if (loading || !userLocation) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading {selectedService === 'car' ? 'cars' : 'bikes'} near you...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-40">
      <div className="h-full flex flex-col">
        {/* Header with service icon */}
        <header className="p-4 border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div className="flex items-center">
              <div className={`p-2 rounded-full mr-2 ${serviceColors[selectedService]}`}>
                {serviceIcons[selectedService]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Available {selectedService === 'car' ? 'Cars' : 'Bikes'}
                  {vehicleType && ` (${vehicleType})`}
                </h2>
                <div className="flex items-center text-sm text-gray-600">
                  <FaLocationArrow className="text-green-500 mr-1" />
                  <span>Your Location</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map */}
          <div className="w-full md:w-1/2 h-64 md:h-full border-r">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={userLocation}
              zoom={14}
            >
              {/* User location marker */}
              <Marker
                position={userLocation}
                icon={{
                  url: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />

              {/* Vehicle markers with proper service icons */}
              {vehicles.map(vehicle => (
                <Marker
                  key={vehicle.id}
                  position={vehicle.position}
                  icon={{
                    url: serviceIconUrls[vehicle.vehicleType],
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  {activeMarker === vehicle.id && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div className="p-2">
                        <div className="flex items-center text-sm mt-1">
                          <FaUser className="mr-1" /> {vehicle.driver?.name || 'Driver'}
                          <span className="mx-2">•</span>
                          <FaStar className="text-yellow-400 mr-1" />
                          {vehicle.driver?.rating?.toFixed(1) || '4.5'}
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold">₹{vehicle.fare || '300'}</div>
                          <div className="text-sm">
                            {vehicle.distanceFromUser?.toFixed(1) || '0'} km away
                          </div>
                          <div className="text-sm">ETA: {duration}</div>
                        </div>
                        <button
                          onClick={() => bookVehicle(vehicle)}
                          className="mt-2 w-full bg-blue-600 text-white py-1 px-3 rounded text-sm"
                        >
                          {bookingStatus.loading && vehicle.id === selectedVehicle?.id ?
                            bookingStatus.message : "Book Now"}
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              ))}
            </GoogleMap>
          </div>

          {/* Vehicle List */}
          <div className="w-full md:w-1/2 overflow-y-auto bg-white">
            <div className="p-4 border-b sticky top-0 bg-white flex items-center">
              <div className={`p-1 rounded-full mr-2 ${serviceColors[selectedService]}`}>
                {serviceIcons[selectedService]}
              </div>
              <h3 className="font-semibold">
                {vehicles.length} {selectedService === 'car' ? 'Cars' : 'Bikes'} Available
                {vehicleType && ` (${vehicleType})`}
                <span className="text-sm text-gray-500 ml-2 font-normal">
                  (Nearest first)
                </span>
              </h3>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className={`p-3 rounded-full inline-block ${serviceColors[selectedService]} mb-3`}>
                  {serviceIcons[selectedService]}
                </div>
                <p className="text-lg font-medium">No {selectedService === 'car' ? 'cars' : 'bikes'} found</p>
              </div>
            ) : (
              <div className="divide-y">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className={`p-4 cursor-pointer ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FaUser className="mr-1" /> {vehicle.driver?.name || 'Driver'}
                            <span className="mx-2">•</span>
                            <FaStar className="text-yellow-400 mr-1" />
                            {vehicle.driver?.rating?.toFixed(1) || '4.5'}
                            <span className="mx-2">•</span>
                            <span className="text-green-600">
                              {vehicle.distanceFromUser?.toFixed(1) || '0'} km
                            </span>
                          </div>
                          <div className="mt-2">
                            {vehicle.amenities?.includes('ac') && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-1">
                                <FaSnowflake className="inline mr-1" /> AC
                              </span>
                            )}
                            {vehicle.amenities?.includes('wifi') && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                <FaWifi className="inline mr-1" /> WiFi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{vehicle.fare || '300'}</div>
                        <div className="text-sm text-gray-500">ETA: {duration}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="p-4 border-t bg-white sticky bottom-0 flex gap-2">
          {/* Book Nearest Vehicle Button */}


          <button
            onClick={bookNearestVehicle}
            disabled={bookingStatus.loading || vehicles.length === 0}
            className={`flex-1 ${bookingStatus.loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-3 rounded-lg flex items-center justify-center`}
          >
            {bookingStatus.loading ? (
              <span>{bookingStatus.message}</span>
            ) : (
              <>
                <div className={`p-1 rounded-full mr-2 ${serviceColors[selectedService]}`}>
                  {serviceIcons[selectedService]}
                </div>
                Book A Nearby Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleBooking;
