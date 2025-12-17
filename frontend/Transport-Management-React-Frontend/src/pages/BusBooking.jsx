import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaBus,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaUser,
  FaWifi,
  FaSnowflake,
  FaCheckCircle,
  FaUsers,
  FaFilter,
  FaTimes,
  FaWheelchair,
  FaPlane,
  FaTrain,
  FaCar,
  FaChair,
  FaBed
} from "react-icons/fa";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useNavigate, useLocation } from "react-router-dom";
// import { db, ref, onValue } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const BusBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    fromCity = "",
    toCity = "",
    departureDate = ""
  } = location.state || {};

  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({
    lat: 26.7605545,
    lng: 83.3731675
  });
  const [activeMarker, setActiveMarker] = useState(null);
  const [routeError, setRouteError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states (remove price range filter)
  const [filters, setFilters] = useState({
    busType: [],
    amenities: [],
    departureTime: [],
    rating: 0,
    seatAvailability: "all"
  });

  // Available filter options (remove price range)
  const filterOptions = {
    busTypes: [
      { id: "ac-sleeper", name: "AC Sleeper", icon: <FaSnowflake className="mr-2" /> },
      { id: "non-ac-sleeper", name: "Non-AC Sleeper", icon: <FaBed className="mr-2" /> },
      { id: "ac-seater", name: "AC Seater", icon: <FaChair className="mr-2" /> },
      { id: "non-ac-seater", name: "Non-AC Seater", icon: <FaChair className="mr-2" /> },
      { id: "volvo", name: "Volvo", icon: <FaBus className="mr-2" /> },
      { id: "sleeper", name: "Sleeper", icon: <FaBed className="mr-2" /> }
    ],
    amenities: [
      { id: "wifi", name: "WiFi", icon: <FaWifi className="mr-2" /> },
      { id: "ac", name: "AC", icon: <FaSnowflake className="mr-2" /> },
      { id: "charging", name: "Charging", icon: <FaPlane className="mr-2" /> },
      { id: "wheelchair", name: "Wheelchair", icon: <FaWheelchair className="mr-2" /> },
      { id: "blanket", name: "Blanket", icon: <FaTrain className="mr-2" /> },
      { id: "water", name: "Water", icon: <FaCar className="mr-2" /> }
    ],
    departureTimes: [
      { id: "morning", name: "Morning (6AM-12PM)" },
      { id: "afternoon", name: "Afternoon (12PM-5PM)" },
      { id: "evening", name: "Evening (5PM-9PM)" },
      { id: "night", name: "Night (9PM-6AM)" }
    ]
  };

  useEffect(() => {
    const busesRef = ref(db, 'vehicles');
    const unsubscribe = onValue(busesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredBuses = Object.values(data)
          .filter(vehicle => {
            const vehicleType = (vehicle.vehicleType || '').toLowerCase();
            const isBus = vehicleType === 'bus';
            
            const matchesRoute = 
              vehicle.from?.toLowerCase().includes(fromCity.toLowerCase()) &&
              vehicle.to?.toLowerCase().includes(toCity.toLowerCase());
            
            const isActive = vehicle.status === 'Active';
            
            const matchesDate = 
              vehicle.startDate === departureDate || 
              (vehicle.startDate && departureDate && 
               new Date(vehicle.startDate).toDateString() === new Date(departureDate).toDateString());
            
            return isBus && matchesRoute && isActive && matchesDate;
          })
          .map(bus => ({
            ...bus,
            id: bus.id || Math.random().toString(36).substr(2, 9),
            vehicleType: 'bus',
            driverName: bus.driver?.name || 'Driver',
            driverRating: parseFloat(bus.driver?.rating || '4.5'),
            distance: bus.distance || bus.routeDistance || 'N/A',
            duration: bus.duration || bus.routeDuration || 'N/A',
            seatingCapacity: bus.seatingCapacity || 0,
            passengerCount: bus.passengerCount || 0,
            busType: bus.busType || 'Non-AC Seater',
            amenities: bus.amenities || ['ac', 'wifi'].filter(a => Math.random() > 0.5),
            departureTime: bus.departureTime || ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
            availableSeats: bus.seatingCapacity - bus.passengerCount
          }));

        setBuses(filteredBuses);
        setFilteredBuses(filteredBuses);
        setRouteError(filteredBuses.length === 0);
        
        if (filteredBuses.length > 0) {
          setMapCenter({
            lat: filteredBuses[0].position?.lat || 26.7605545,
            lng: filteredBuses[0].position?.lng || 83.3731675
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fromCity, toCity, departureDate]);

  // Apply filters (remove price range check)
  useEffect(() => {
    if (buses.length === 0) return;

    const filtered = buses.filter(bus => {
      // Bus type filter
      if (filters.busType.length > 0) {
        const busTypeMatch = filters.busType.some(type => 
          bus.busType.toLowerCase().includes(type.toLowerCase())
        );
        if (!busTypeMatch) return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const amenitiesMatch = filters.amenities.every(amenity => 
          bus.amenities?.includes(amenity)
        );
        if (!amenitiesMatch) return false;
      }

      // Departure time filter
      if (filters.departureTime.length > 0 && !filters.departureTime.includes(bus.departureTime)) {
        return false;
      }

      // Rating filter
      if (bus.driverRating < filters.rating) {
        return false;
      }

      // Seat availability filter
      if (filters.seatAvailability === "high" && bus.availableSeats < 10) {
        return false;
      }
      if (filters.seatAvailability === "low" && bus.availableSeats >= 10) {
        return false;
      }
      if (filters.seatAvailability === "none" && bus.availableSeats > 0) {
        return false;
      }

      return true;
    });

    setFilteredBuses(filtered);
  }, [filters, buses]);

  const handleBusSelect = (bus) => {
    if (!fromCity || !toCity) {
      alert("Please ensure both departure and destination cities are selected");
      return;
    }
    
    navigate('/bus-seats', {
      state: {
        selectedVehicle: {
          ...bus,
          type: 'bus',
          driver: bus.driverName,
          vehicleNumber: bus.id,
          rating: bus.driverRating,
          eta: formatDuration(bus.duration),
          seatingCapacity: bus.seatingCapacity,
          passengerCount: bus.passengerCount,
          busType: bus.busType,
          fromCity,
          toCity
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 'N/A') return "N/A";
    
    if (typeof duration === 'string' && duration.includes('h')) {
      return duration;
    }
    
    const mins = typeof duration === 'number' ? duration : parseInt(duration.toString().replace(/\D/g, ''));
    if (!isNaN(mins)) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    
    return "N/A";
  };

  const formatDistance = (distance) => {
    if (!distance || distance === 'N/A') return "N/A";
    
    if (typeof distance === 'string' && distance.includes('km')) {
      return distance;
    }
    
    if (typeof distance === 'number') {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    
    return "N/A";
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      if (filterType === 'busType' || filterType === 'amenities' || filterType === 'departureTime') {
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
      busType: [],
      amenities: [],
      departureTime: [],
      rating: 0,
      seatAvailability: "all"
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available buses...</p>
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
              <h2 className="text-xl font-semibold text-gray-800">Available Bus Rides</h2>
              <div className="flex items-center text-sm text-gray-600">
                <FaMapMarkerAlt className="text-blue-500 mr-1" />
                <span className="font-medium">{fromCity}</span>
                <span className="mx-1">→</span>
                <FaMapMarkerAlt className="text-green-500 mr-1" />
                <span className="font-medium">{toCity}</span>
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

        {/* Show error if no buses found for the route */}
        {routeError && (
          <div className="bg-red-50 text-red-700 p-4 text-center border-b">
            <p className="font-medium">No buses available for the route: {fromCity} to {toCity}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 text-blue-600 font-medium hover:underline"
            >
              ← Change route
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bus Type Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Bus Type</h4>
                    <div className="space-y-2">
                      {filterOptions.busTypes.map(type => (
                        <label key={type.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.busType.includes(type.id)}
                            onChange={() => handleFilterChange('busType', type.id)}
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

                  {/* Departure Time Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Departure Time</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {filterOptions.departureTimes.map(time => (
                        <label key={time.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.departureTime.includes(time.id)}
                            onChange={() => handleFilterChange('departureTime', time.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">{time.name}</span>
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

                  {/* Seat Availability Filter */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Seat Availability</h4>
                    <div className="space-y-2">
                      {[
                        { id: "all", name: "All Buses" },
                        { id: "high", name: "High (10+ seats)" },
                        { id: "low", name: "Low (1-9 seats)" },
                        { id: "none", name: "Almost Full" }
                      ].map(option => (
                        <label key={option.id} className="flex items-center">
                          <input
                            type="radio"
                            name="seatAvailability"
                            checked={filters.seatAvailability === option.id}
                            onChange={() => setFilters(prev => ({ ...prev, seatAvailability: option.id }))}
                            className="rounded-full text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">{option.name}</span>
                        </label>
                      ))}
                    </div>
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
              zoom={12}
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
              {filteredBuses.map(bus => (
                <Marker
                  key={bus.id}
                  position={bus.position}
                  icon={{
                    url: 'https://cdn-icons-png.flaticon.com/512/2972/2972035.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  onClick={() => {
                    setSelectedBus(bus);
                    setActiveMarker(bus.id);
                  }}
                >
                  {activeMarker === bus.id && (
                    <InfoWindow 
                      onCloseClick={() => setActiveMarker(null)}
                      options={{ maxWidth: 250 }}
                    >
                      <div className="p-2">
                        <h4 className="font-bold text-gray-800">Bus - {bus.id}</h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FaUser className="mr-1" /> {bus.driverName}
                          <span className="mx-2">•</span>
                          <FaStar className="text-yellow-400 mr-1" />
                          {bus.driverRating.toFixed(1)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-blue-600 font-medium">ETA</div>
                            <div className="font-semibold">{formatDuration(bus.duration)}</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xs text-green-600 font-medium">Distance</div>
                            <div className="font-semibold">{formatDistance(bus.distance)}</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <div className="text-xs text-purple-600 font-medium">Seats</div>
                            <div className="font-semibold">{bus.availableSeats}/{bus.seatingCapacity}</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleBusSelect(bus)}
                          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Select Seats
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              ))}
            </GoogleMap>
          </div>

          {/* Bus List */}
          <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800">
                  {filteredBuses.length} Bus{filteredBuses.length !== 1 ? 'es' : ''} Available
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="text-blue-500 mr-2" />
                  <span>{departureDate}</span>
                </div>
              </div>
            </div>

            {filteredBuses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaBus className="text-4xl mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No buses match your filters</p>
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
                {filteredBuses.map(bus => (
                  <motion.div
                    key={bus.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      setSelectedBus(bus);
                      setActiveMarker(bus.id);
                    }}
                    className={`p-4 cursor-pointer transition-colors ${selectedBus?.id === bus.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <FaBus className="text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Bus - {bus.id}</h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <span className="flex items-center mr-3">
                              <FaUser className="text-gray-500 mr-1" />
                              {bus.driverName}
                            </span>
                            <span className="flex items-center">
                              <FaStar className="text-yellow-400 mr-1" />
                              {bus.driverRating.toFixed(1)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                              {bus.busType}
                            </span>
                            {bus.amenities?.includes('ac') && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <FaSnowflake className="mr-1" /> AC
                              </span>
                            )}
                            {bus.amenities?.includes('wifi') && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <FaWifi className="mr-1" /> WiFi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDuration(bus.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bus.availableSeats} seats left
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
        {selectedBus && (
          <div className="p-4 border-t bg-white shadow-lg sticky bottom-0">
            <button
              onClick={() => handleBusSelect(selectedBus)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center"
            >
              <FaCheckCircle className="mr-2" /> 
              Select Seats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusBooking;