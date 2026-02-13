import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaBus,
  FaCar,
  FaMotorcycle,
  FaShuttleVan,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaUser,
  FaWifi,
  FaSnowflake,
  FaDoorClosed,
  FaDoorOpen,
  FaGasPump,
  FaTachometerAlt,
  FaCheckCircle,
  FaUsers
} from "react-icons/fa";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useNavigate, useLocation } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    fromCity = "",
    toCity = "",
    departureDate = "",
    selectedService = "bus"
  } = location.state || {};

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({
    lat: 26.7605545,
    lng: 83.3731675
  });
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    const vehiclesRef = ref(db, 'vehicles');
    const unsubscribe = onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredVehicles = Object.values(data)
          .filter(vehicle => {
            const vehicleType = (vehicle.vehicleType || '').toLowerCase();
            const serviceType = (selectedService || '').toLowerCase();
            return vehicleType === serviceType && vehicle.from.includes(fromCity);
          })
          .map(vehicle => ({
            ...vehicle,
            vehicleType: vehicle.vehicleType || 'car',
            driverName: vehicle.driver?.name || 'Driver',
            driverRating: vehicle.driver?.rating || '4.5',
            distance: vehicle.distance || vehicle.routeDistance || 'N/A',
            duration: vehicle.duration || vehicle.routeDuration || 'N/A',
            seatingCapacity: vehicle.seatingCapacity || 0
          }));

        setVehicles(filteredVehicles);
        if (filteredVehicles.length > 0) {
          setMapCenter({
            lat: filteredVehicles[0].position?.lat || 26.7605545,
            lng: filteredVehicles[0].position?.lng || 83.3731675
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedService, fromCity]);

const handleVehicleSelect = (vehicle) => {
  if (vehicle.vehicleType.toLowerCase() === 'bus') {
    navigate('/bus-seats', {
      state: {
        selectedVehicle: {
          ...vehicle,
          type: vehicle.vehicleType || 'bus',
          driver: vehicle.driverName,
          vehicleNumber: vehicle.id,
          rating: vehicle.driverRating,
          eta: formatDuration(vehicle.duration),
          seatingCapacity: vehicle.seatingCapacity || 0, // Get from Firebase
          passengerCount: vehicle.passengerCount || 0,    // Get from Firebase
          busType: vehicle.busType || 'Non-AC Seater'    // Get from Firebase
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  } else {
    navigate('/book', {
      state: {
        selectedVehicle: {
          ...vehicle,
          type: vehicle.vehicleType || 'car',
          driver: vehicle.driverName,
          vehicleNumber: vehicle.id,
          rating: vehicle.driverRating,
          eta: formatDuration(vehicle.duration)
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  }
};

  const handleBookRide = () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle first");
      return;
    }

    navigate('/book', {
      state: {
        selectedVehicle: {
          ...selectedVehicle,
          type: selectedVehicle.vehicleType || 'car',
          driver: selectedVehicle.driverName,
          vehicleNumber: selectedVehicle.id,
          rating: selectedVehicle.driverRating,
          fare: `₹${Math.round(parseInt(selectedVehicle.distance || 0) * 10)}`,
          eta: formatDuration(selectedVehicle.duration)
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  };

  const getVehicleIcon = (type) => {
    const vehicleType = (type || 'car').toLowerCase();
    switch (vehicleType) {
      case 'bus': return <FaBus className="text-xl" />;
      case 'car': return <FaCar className="text-xl" />;
      case 'auto': return <FaShuttleVan className="text-xl" />;
      case 'bike': return <FaMotorcycle className="text-xl" />;
      default: return <FaCar className="text-xl" />;
    }
  };

  const getVehicleIconUrl = (type) => {
    const vehicleType = (type || 'car').toLowerCase();
    switch (vehicleType) {
      case 'bus': return 'https://cdn-icons-png.flaticon.com/512/2972/2972035.png';
      case 'car': return 'https://cdn-icons-png.flaticon.com/512/3079/3079026.png';
      case 'auto': return 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png';
      case 'bike': return 'https://cdn-icons-png.flaticon.com/512/2745/2745697.png';
      default: return 'https://cdn-icons-png.flaticon.com/512/2972/2972035.png';
    }
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading available vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-40">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 mr-2"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold">Available {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Rides</h2>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FaMapMarkerAlt className="text-orange-500 mr-1" />
            <span className="font-medium">{fromCity}</span>
            <span className="mx-1">→</span>
            <FaMapMarkerAlt className="text-green-500 mr-1" />
            <span className="font-medium">{toCity}</span>
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={12}
          >
            {vehicles.map(vehicle => (
              <Marker
                key={vehicle.id}
                position={vehicle.position}
                icon={{
                  url: getVehicleIconUrl(vehicle.vehicleType),
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
                onClick={() => handleVehicleSelect(vehicle)}
              >
                {activeMarker === vehicle.id && (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                    <div className="p-2">
                      <h4 className="font-bold">{vehicle.vehicleType} - {vehicle.id}</h4>
                      <p className="text-sm">Driver: {vehicle.driverName}</p>
                      <p className="text-sm">ETA: {formatDuration(vehicle.duration)}</p>
                      <p className="text-sm">Distance: {formatDistance(vehicle.distance)}</p>
                      {vehicle.vehicleType.toLowerCase() === 'bus' && (
                        <p className="text-sm">Seats: {vehicle.seatingCapacity}</p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))}
          </GoogleMap>
        </div>

        {/* Vehicle List */}
        <div className="border-t h-1/3 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">
                {vehicles.length} {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}{vehicles.length !== 1 ? 's' : ''} Available
              </h3>
              <div className="flex items-center text-sm">
                <FaCalendarAlt className="text-purple-500 mr-1" />
                <span>{departureDate}</span>
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBus className="text-4xl mx-auto mb-4 text-gray-300" />
                <p>No {selectedService}s available for this route</p>
                <button
                  onClick={() => navigate(-1)}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Back to Search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className={`p-4 border rounded-lg cursor-pointer transition ${selectedVehicle?.id === vehicle.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-white'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mr-3">
                          {getVehicleIcon(vehicle.vehicleType)}
                        </div>
                        <div>
                          <h4 className="font-medium">{vehicle.vehicleType} - {vehicle.id}</h4>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="flex items-center mr-2">
                              <FaUser className="text-gray-500 mr-1" />
                              {vehicle.driverName}
                            </span>
                            <span className="flex items-center">
                              <FaStar className="text-yellow-400 mr-1" />
                              {vehicle.driverRating}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">ETA: {formatDuration(vehicle.duration)}</p>
                        {vehicle.vehicleType.toLowerCase() === 'bus' && (
                          <>
                            <p className="text-xs text-gray-600">Distance: {formatDistance(vehicle.distance)}</p>
                           
                          </>
                        )}
                        {vehicle.vehicleType.toLowerCase() !== 'bus' && (
                          <p className="text-xs text-gray-600">Direct ride</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {vehicle.acStatus && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded flex items-center">
                          <FaSnowflake className="mr-1" /> AC
                        </span>
                      )}
                      {vehicle.wifiConnected && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded flex items-center">
                          <FaWifi className="mr-1" /> WiFi
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded flex items-center">
                        <FaTachometerAlt className="mr-1" /> {vehicle.speed || 0} km/h
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded flex items-center">
                        <FaGasPump className="mr-1" /> {Math.round(vehicle.fuel || 0)}%
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded flex items-center">
                        {vehicle.doorsOpen ? (
                          <>
                            <FaDoorOpen className="mr-1 text-red-500" /> Doors Open
                          </>
                        ) : (
                          <>
                            <FaDoorClosed className="mr-1 text-green-500" /> Doors Closed
                          </>
                        )}
                      </span>
                      {vehicle.vehicleType.toLowerCase() === 'bus' && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded flex items-center">
                          <FaUsers className="mr-1" /> {vehicle.seatingCapacity} seats
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Book Button */}
          {selectedVehicle && (
            <div className="p-4 border-t bg-white shadow-lg">
              <button
                onClick={handleBookRide}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center"
              >
                <FaCheckCircle className="mr-2" /> Confirm Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
