import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaCar,
  FaMotorcycle,
  FaShuttleVan,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaUser,
  FaCheckCircle,
  FaFilter,
  FaTimes,
  FaSnowflake,
  FaWifi,
  FaChair
} from "react-icons/fa";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useNavigate, useLocation } from "react-router-dom";
// import { db, ref, onValue } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const VehicleBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    fromCity = "",
    toCity = "",
    departureDate = "",
    selectedService = "car"
  } = location.state || {};

  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({
    lat: 26.7605545,
    lng: 83.3731675
  });
  const [activeMarker, setActiveMarker] = useState(null);
  const [distanceMatrixService, setDistanceMatrixService] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState("");
  const [routeError, setRouteError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    vehicleType: [],
    amenities: [],
    rating: 0,
    priceRange: [0, 5000]
  });

  // Available filter options
  const filterOptions = {
    vehicleTypes: [
      { id: "car", name: "Car", icon: <FaCar className="mr-2" /> },
      { id: "bike", name: "Bike", icon: <FaMotorcycle className="mr-2" /> },
      { id: "auto", name: "Auto", icon: <FaShuttleVan className="mr-2" /> }
    ],
    amenities: [
      { id: "ac", name: "AC", icon: <FaSnowflake className="mr-2" /> },
      { id: "wifi", name: "WiFi", icon: <FaWifi className="mr-2" /> },
      { id: "comfort", name: "Comfort Seats", icon: <FaChair className="mr-2" /> }
    ]
  };

  // Initialize Distance Matrix Service
  useEffect(() => {
    if (window.google) {
      setDistanceMatrixService(new window.google.maps.DistanceMatrixService());
    }
  }, []);

  // Calculate distance and duration
  useEffect(() => {
    if (!distanceMatrixService || !fromCity || !toCity) return;

    distanceMatrixService.getDistanceMatrix({
      origins: [fromCity],
      destinations: [toCity],
      travelMode: 'DRIVING',
      unitSystem: window.google.maps.UnitSystem.METRIC,
    }, (response, status) => {
      if (status === 'OK') {
        const distance = response.rows[0].elements[0].distance.value / 1000;
        const duration = response.rows[0].elements[0].duration.text;
        setDistance(distance);
        setDuration(duration);
      } else {
        console.error('Error calculating distance:', status);
      }
    });
  }, [fromCity, toCity, distanceMatrixService]);

  // Calculate fare based on vehicle type and distance
  const calculateFare = (vehicleType, distance) => {
    const fareRates = {
      car: 12,
      bike: 8,
      auto: 10
    };

    const minFares = {
      car: 300,
      bike: 100,
      auto: 150
    };

    const fare = Math.round((fareRates[vehicleType] || 10) * distance);
    return Math.max(fare, minFares[vehicleType] || 100);
  };

  // Fetch vehicles from Firebase and filter by service type and from city
  useEffect(() => {
    const vehiclesRef = ref(db, 'vehicles');
    const unsubscribe = onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredVehicles = Object.values(data)
          .filter(vehicle => {
            const vehicleType = (vehicle.vehicleType || '').toLowerCase();
            const vehicleFromCity = (vehicle.from || '').toLowerCase();
            const matchesService = vehicleType === selectedService;
            const matchesFromCity = fromCity ?
              vehicleFromCity.includes(fromCity.toLowerCase()) : true;

            return matchesService && matchesFromCity;
          })
          .map(vehicle => ({
            ...vehicle,
            vehicleType: selectedService,
            driverName: vehicle.driver?.name || 'Driver',
            driverRating: parseFloat(vehicle.driver?.rating || '4.5'),
            distance: distance,
            duration: duration,
            fare: calculateFare(selectedService, distance),
            position: vehicle.position || {
              lat: mapCenter.lat + Math.random() * 0.01,
              lng: mapCenter.lng + Math.random() * 0.01
            },
            amenities: vehicle.amenities || ['ac'].filter(a => Math.random() > 0.5)
          }));

        setVehicles(filteredVehicles);
        setFilteredVehicles(filteredVehicles);
        setRouteError(filteredVehicles.length === 0);

        if (filteredVehicles.length > 0) {
          setMapCenter(filteredVehicles[0].position);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedService, distance, fromCity]);

  // Apply filters
  useEffect(() => {
    if (vehicles.length === 0) return;

    const filtered = vehicles.filter(vehicle => {
      // Vehicle type filter
      if (filters.vehicleType.length > 0 && !filters.vehicleType.includes(vehicle.vehicleType)) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const amenitiesMatch = filters.amenities.every(amenity =>
          vehicle.amenities?.includes(amenity)
        );
        if (!amenitiesMatch) return false;
      }

      // Rating filter
      if (vehicle.driverRating < filters.rating) {
        return false;
      }

      // Price range filter
      if (vehicle.fare < filters.priceRange[0] || vehicle.fare > filters.priceRange[1]) {
        return false;
      }

      return true;
    });

    setFilteredVehicles(filtered);
  }, [filters, vehicles]);

  const handleVehicleSelect = (vehicle) => {
    if (!fromCity || !toCity) {
      alert("Please ensure both departure and destination cities are selected");
      return;
    }

    navigate('/book', {
      state: {
        selectedVehicle: {
          ...vehicle,
          type: vehicle.vehicleType,
          driver: vehicle.driverName,
          vehicleNumber: vehicle.id,
          rating: vehicle.driverRating,
          eta: duration,
          fare: `₹${vehicle.fare}`,
          fromCity,
          toCity,
          departureDate
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  };

  const getVehicleIconUrl = (type) => {
    switch (type) {
      case 'car': return 'https://cdn-icons-png.flaticon.com/512/3079/3079026.png';
      case 'bike': return 'https://cdn-icons-png.flaticon.com/512/2745/2745697.png';
      case 'auto': return 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png';
      default: return 'https://cdn-icons-png.flaticon.com/512/3079/3079026.png';
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'car': return <FaCar className="text-xl" />;
      case 'bike': return <FaMotorcycle className="text-xl" />;
      case 'auto': return <FaShuttleVan className="text-xl" />;
      default: return <FaCar className="text-xl" />;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      if (filterType === 'vehicleType' || filterType === 'amenities') {
        const currentValues = [...prev[filterType]];
        const index = currentValues.indexOf(value);

        if (index === -1) {
          currentValues.push(value);
        } else {
          currentValues.splice(index, 1);
        }

        return { ...prev, [filterType]: currentValues };
      }

      return { ...prev, [filterType]: value };
    });
  };

  const resetFilters = () => {
    setFilters({
      vehicleType: [],
      amenities: [],
      rating: 0,
      priceRange: [0, 5000]
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-40">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="p-4 border-b flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Available {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Rides
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <FaMapMarkerAlt className="text-blue-500 mr-1" />
                <span className="font-medium">{fromCity || 'Not selected'}</span>
                <span className="mx-1">→</span>
                <FaMapMarkerAlt className="text-green-500 mr-1" />
                <span className="font-medium">{toCity || 'Not selected'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              <FaCalendarAlt className="mr-2" />
              <span>{departureDate}</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-blue-100 hover:text-blue-600 transition-colors`}
            >
              <FaFilter />
            </button>
          </div>
        </header>

        {/* Show error if no vehicles found */}
        {routeError && (
          <div className="bg-red-50 text-red-700 p-4 text-center border-b">
            <p className="font-medium">
              No {selectedService}s available from {fromCity || 'selected location'}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 text-blue-600 font-medium hover:underline"
            >
              ← Change location
            </button>
          </div>
        )}

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-white border-b shadow-sm"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg flex items-center">
                    <FaFilter className="mr-2 text-blue-500" />
                    Filters
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-gray-600 hover:text-blue-600"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Type Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Vehicle Type</h4>
                    <div className="space-y-2">
                      {filterOptions.vehicleTypes.map(type => (
                        <label key={type.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.vehicleType.includes(type.id)}
                            onChange={() => handleFilterChange('vehicleType', type.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700 flex items-center">
                            {type.icon} {type.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Amenities</h4>
                    <div className="space-y-2">
                      {filterOptions.amenities.map(amenity => (
                        <label key={amenity.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.amenities.includes(amenity.id)}
                            onChange={() => handleFilterChange('amenities', amenity.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700 flex items-center">
                            {amenity.icon} {amenity.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Minimum Rating: {filters.rating.toFixed(1)} ★
                    </h4>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFilters(prev => ({ ...prev, rating: star }))}
                          className={`text-2xl ${star <= filters.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>₹0</span>
                      <span>₹5000</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={filters.priceRange[0]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                      }))}
                      className="w-full mb-2"
                    />
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map View */}
          <div className="w-full md:w-1/2 h-64 md:h-full relative border-r">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={14}
              options={{
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                  }
                ]
              }}
            >
              {filteredVehicles.map(vehicle => (
                <Marker
                  key={vehicle.id}
                  position={vehicle.position}
                  icon={{
                    url: getVehicleIconUrl(vehicle.vehicleType),
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setActiveMarker(vehicle.id);
                  }}
                >
                  {activeMarker === vehicle.id && (
                    <InfoWindow
                      onCloseClick={() => setActiveMarker(null)}
                      options={{ maxWidth: 250 }}
                    >
                      <div className="p-2">
                        <h4 className="font-bold text-gray-800">
                          {vehicle.vehicleType.toUpperCase()} - {vehicle.id}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FaUser className="mr-1" /> {vehicle.driverName}
                          <span className="mx-2">•</span>
                          <FaStar className="text-yellow-400 mr-1" />
                          {vehicle.driverRating.toFixed(1)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-blue-600 font-medium">ETA</div>
                            <div className="font-semibold">{duration}</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xs text-green-600 font-medium">Distance</div>
                            <div className="font-semibold">{distance.toFixed(1)} km</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <div className="text-xs text-purple-600 font-medium">Fare</div>
                            <div className="font-semibold">₹{vehicle.fare}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleVehicleSelect(vehicle)}
                          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              ))}
            </GoogleMap>
          </div>

          {/* Vehicle List */}
          <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800">
                  {filteredVehicles.length} {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}
                  {filteredVehicles.length !== 1 ? 's' : ''} Available
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="text-blue-500 mr-2" />
                  <span>{departureDate}</span>
                </div>
              </div>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {getVehicleIcon(selectedService)}
                <p className="text-lg font-medium mb-2 mt-4">
                  No {selectedService}s match your filters
                </p>
                <p className="text-sm mb-6">Try adjusting your filters or search criteria</p>
                <button
                  onClick={resetFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredVehicles.map(vehicle => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setActiveMarker(vehicle.id);
                    }}
                    className={`p-4 cursor-pointer transition-colors ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${vehicle.vehicleType === 'car' ? 'bg-blue-100 text-blue-600' :
                            vehicle.vehicleType === 'bike' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                          }`}>
                          {getVehicleIcon(vehicle.vehicleType)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {vehicle.vehicleType.toUpperCase()} - {vehicle.id}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <span className="flex items-center mr-3">
                              <FaUser className="text-gray-500 mr-1" />
                              {vehicle.driverName}
                            </span>
                            <span className="flex items-center">
                              <FaStar className="text-yellow-400 mr-1" />
                              {vehicle.driverRating.toFixed(1)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {vehicle.amenities?.includes('ac') && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <FaSnowflake className="mr-1" /> AC
                              </span>
                            )}
                            {vehicle.amenities?.includes('wifi') && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <FaWifi className="mr-1" /> WiFi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          ₹{vehicle.fare}
                        </div>
                        <div className="text-xs text-gray-500">
                          {duration}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book Button */}
        {selectedVehicle && (
          <div className="p-4 border-t bg-white shadow-lg sticky bottom-0">
            <button
              onClick={() => handleVehicleSelect(selectedVehicle)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center"
            >
              <FaCheckCircle className="mr-2" />
              Book Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleBooking;