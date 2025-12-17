import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoogleMap,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";
// import { db, ref, onValue, update, remove } from "../firebase";
import AddVehicleModal from "../components/AddVehicleModal";
import { DetailCard } from "../components/DetailedCard";
import {
  FaBus as BusIcon,
  FaCar as CarIcon,
  FaTruck as TruckIcon,
  FaMotorcycle as BikeIcon,
  FaIdCard as IdCardIcon,
  FaFileAlt as LicenseIcon,
  FaCalendarAlt as CalendarIcon,
  FaPhone as PhoneIcon,
  FaCommentAlt as MessageIcon,
  FaRoute as RouteIcon,
  FaTachometerAlt as GaugeIcon,
  FaCog as SettingsIcon,
  FaGasPump as FuelIcon,
  FaThermometerHalf as TemperatureIcon,
  FaBolt as EngineIcon,
  FaChevronUp as ChevronUpIcon,
  FaChevronDown as ChevronDownIcon,
  FaMapMarkerAlt as CheckpointIcon,
  FaUsers as PassengerIcon,
  FaWifi as WifiIcon,
  FaSnowflake as AcIcon,
  FaDoorOpen as DoorIcon,
  FaExclamationTriangle as AlertIcon,
  FaChartLine as StatsIcon,
  FaEdit as EditIcon,
  FaTrash as TrashIcon
} from "react-icons/fa";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 26.7606,
  lng: 83.3732,
};

const vehicleIcons = {
  Bus: "https://img.icons8.com/color/48/bus--v1.png",
  Car: "https://img.icons8.com/color/48/car--v1.png",
  Truck: "https://img.icons8.com/color/48/truck--v1.png",
  Bike: "https://img.icons8.com/color/48/motorcycle--v1.png",
};

const Dashboard = () => {
  const scrollRef = useRef(null);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(null);
  const [directions, setDirections] = useState(null);
  const [pathCoords, setPathCoords] = useState([]);
  const [markerIndex, setMarkerIndex] = useState(0);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [checkpointMarkers, setCheckpointMarkers] = useState([]);
  const [vehicleMetrics, setVehicleMetrics] = useState({
    speed: 0,
    fuel: 0,
    engineTemp: 0,
    passengerCount: 0,
    wifiConnected: false,
    acStatus: false,
    doorsOpen: false,
    alerts: []
  });
  const [realTimeStats, setRealTimeStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    alerts: 0,
    passengersToday: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [passedCheckpoints, setPassedCheckpoints] = useState([]);
  const [vehicleToUpdate, setVehicleToUpdate] = useState(null);
  const movementIntervalRef = useRef(null);

  const generateVehicleMetrics = useCallback(() => {
    const vehicle = selectedVehicleIndex !== null && vehicles[selectedVehicleIndex] ? vehicles[selectedVehicleIndex] : null;
    return {
      speed: Math.floor(Math.random() * 80) + 20,
      fuel: Math.max(0, Math.min(100, (vehicle?.fuel || 100) - Math.random() * 5)),
      engineTemp: Math.floor(Math.random() * 30) + 70,
      passengerCount: vehicle?.passengerCount || Math.floor(Math.random() * (vehicle?.seatingCapacity || 50)),
      wifiConnected: vehicle?.wifiConnected || Math.random() > 0.3,
      acStatus: vehicle?.acStatus || (vehicle?.busType?.includes("AC") ? Math.random() > 0.2 : false),
      doorsOpen: Math.random() > 0.8,
      alerts: vehicle?.alerts || (Math.random() > 0.7 ? ["Maintenance Due"] : [])
    };
  }, [selectedVehicleIndex, vehicles]);

  useEffect(() => {
    const vehiclesRef = ref(db, "vehicles");
    return onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formatted = Object.values(data).filter(vehicle => vehicle);
      setVehicles(formatted);
      setRealTimeStats({
        totalVehicles: formatted.length,
        activeVehicles: formatted.filter(v => v?.status === 'Active').length,
        alerts: formatted.filter(v => v?.alerts?.length > 0).length,
        passengersToday: formatted.reduce((sum, v) => sum + (v?.passengerCount || 0), 0)
      });
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    if (selectedVehicleIndex === null || !vehicles[selectedVehicleIndex]) return;

    const vehicle = vehicles[selectedVehicleIndex];
    setVehicleMetrics({
      speed: vehicle?.speed || 0,
      fuel: vehicle?.fuel || 0,
      engineTemp: vehicle?.engineTemp || 0,
      passengerCount: vehicle?.passengerCount || 0,
      wifiConnected: vehicle?.wifiConnected || false,
      acStatus: vehicle?.acStatus || false,
      doorsOpen: vehicle?.doorsOpen || false,
      alerts: vehicle?.alerts || []
    });

    const interval = setInterval(() => {
      setVehicleMetrics(prev => ({
        ...generateVehicleMetrics(),
        alerts: prev.alerts.length > 0 ? prev.alerts : generateVehicleMetrics().alerts
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedVehicleIndex, vehicles, generateVehicleMetrics]);

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await remove(ref(db, `vehicles/${vehicleId}`));
        setVehicles(prev => prev.filter(vehicle => vehicle?.vehicleId !== vehicleId));
        if (selectedVehicleIndex !== null && vehicles[selectedVehicleIndex]?.vehicleId === vehicleId) {
          setSelectedVehicleIndex(null);
        }
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("Failed to delete vehicle");
      }
    }
  };

  const handleUpdateVehicle = (vehicle) => {
    if (!vehicle) return;
    setVehicleToUpdate(vehicle);
    setIsModalOpen(true);
  };

  const geocodeAddress = useCallback((address) => {
    return new Promise((resolve) => {
      if (!window.google || !address) {
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          console.error("Geocode failed for address:", address, "Reason:", status);
          resolve(null);
        }
      });
    });
  }, []);

  const handleAddVehicle = useCallback(async (vehicleData) => {
    try {
      if (!vehicleData || !vehicleData.vehicleType) {
        throw new Error("Invalid vehicle data");
      }

      const isBus = vehicleData.vehicleType === "Bus";

      const [origin, destination, ...checkpointLocations] = await Promise.all([
        geocodeAddress(vehicleData.from),
        isBus ? geocodeAddress(vehicleData.to) : Promise.resolve(null),
        ...(isBus ? (vehicleData.checkpoints || []).map(cp => geocodeAddress(cp.address)) : [])
      ]);

      if (!origin) {
        throw new Error("Could not geocode origin address");
      }

      // Base vehicle data
      const vehicleUpdate = {
        vehicleId: vehicleData.vehicleId,
        vehicleType: vehicleData.vehicleType,
        from: vehicleData.from,
        driverId: vehicleData.driverId,
        driver: vehicleData.driver,
        status: vehicleData.status,
        position: {
          lat: origin.lat(),
          lng: origin.lng()
        },
        currentPosition: {
          lat: origin.lat(),
          lng: origin.lng()
        },
        speed: 0,
        fuel: 100,
        engineTemp: 70,
        passengerCount: 0,
        distance: isBus ? vehicleData.routeDistance : null,
        duration: isBus ? vehicleData.routeDuration : null,
        lastUpdated: new Date().toISOString(),
        createdAt: vehicleToUpdate ? vehicleToUpdate.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add type-specific data
      if (isBus) {
        vehicleUpdate.busType = vehicleData.busType;
        vehicleUpdate.seatingCapacity = vehicleData.seatingCapacity;
        vehicleUpdate.licensePlate = vehicleData.licensePlate;
        vehicleUpdate.registrationNumber = vehicleData.registrationNumber;
        vehicleUpdate.fuelType = vehicleData.fuelType;
        vehicleUpdate.modelYear = vehicleData.modelYear;
        vehicleUpdate.to = vehicleData.to;
        vehicleUpdate.startDate = vehicleData.startDate;
        vehicleUpdate.endDate = vehicleData.endDate;

        if (destination) {
          vehicleUpdate.destination = {
            lat: destination.lat(),
            lng: destination.lng()
          };
        }

        if (vehicleData.checkpoints) {
          vehicleUpdate.checkpoints = vehicleData.checkpoints.map((checkpoint, index) => ({
            ...checkpoint,
            position: checkpointLocations[index] ? {
              lat: checkpointLocations[index].lat(),
              lng: checkpointLocations[index].lng()
            } : null,
            order: index + 1
          }));
        }

        if (vehicleData.routePolyline) {
          vehicleUpdate.routePolyline = vehicleData.routePolyline;
          vehicleUpdate.routeDistance = vehicleData.routeDistance;
          vehicleUpdate.routeDuration = vehicleData.routeDuration;
        }
      } else if (vehicleData.vehicleType === "Truck") {
        vehicleUpdate.cargoCapacity = vehicleData.cargoCapacity;
        vehicleUpdate.currentCargo = vehicleData.currentCargo;
        vehicleUpdate.licensePlate = vehicleData.licensePlate;
        vehicleUpdate.registrationNumber = vehicleData.registrationNumber;
        vehicleUpdate.fuelType = vehicleData.fuelType;
        vehicleUpdate.modelYear = vehicleData.modelYear;
        vehicleUpdate.startDate = vehicleData.startDate;
        vehicleUpdate.endDate = vehicleData.endDate;
      } else if (vehicleData.vehicleType === "Car") {
        vehicleUpdate.carType = vehicleData.carType;
        vehicleUpdate.licensePlate = vehicleData.licensePlate;
        vehicleUpdate.registrationNumber = vehicleData.registrationNumber;
        vehicleUpdate.fuelType = vehicleData.fuelType;
        vehicleUpdate.modelYear = vehicleData.modelYear;
      } else if (vehicleData.vehicleType === "Bike") {
        vehicleUpdate.bikeType = vehicleData.bikeType;
        vehicleUpdate.licensePlate = vehicleData.licensePlate;
        vehicleUpdate.registrationNumber = vehicleData.registrationNumber;
        vehicleUpdate.fuelType = vehicleData.fuelType;
        vehicleUpdate.modelYear = vehicleData.modelYear;
      }

      await update(ref(db, `vehicles/${vehicleData.vehicleId}`), vehicleUpdate);
      setIsModalOpen(false);
      setVehicleToUpdate(null);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert(`Failed to save vehicle: ${error.message}`);
    }
  }, [geocodeAddress, vehicleToUpdate]);

  useEffect(() => {
    if (selectedVehicleIndex === null || !vehicles[selectedVehicleIndex]) return;

    const vehicle = vehicles[selectedVehicleIndex];
    if (!vehicle?.position || (vehicle.vehicleType === "Bus" && !vehicle?.destination)) return;

    const origin = vehicle.currentPosition || vehicle.position;
    const directionsService = new window.google.maps.DirectionsService();

    if (vehicle.vehicleType === "Bus") {
      const waypoints = vehicle.checkpoints
        ?.filter(cp => cp?.position)
        .map(cp => ({
          location: cp.position,
          stopover: true
        })) || [];

      directionsService.route(
        {
          origin,
          destination: vehicle.destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          waypoints,
          optimizeWaypoints: true
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
            const route = result.routes[0].overview_path;
            const coords = route.map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));

            let startIdx = 0;
            if (vehicle.currentPosition) {
              const idx = coords.findIndex(
                (pt) =>
                  Math.abs(pt.lat - vehicle.currentPosition.lat) < 0.01 &&
                  Math.abs(pt.lng - vehicle.currentPosition.lng) < 0.01
              );
              startIdx = idx !== -1 ? idx : 0;
            }

            setPathCoords(coords);
            setMarkerIndex(startIdx);
            setPassedCheckpoints([]);

            const markers = vehicle.checkpoints
              ?.filter(cp => cp?.position)
              .map((cp, index) => ({
                position: cp.position,
                label: {
                  text: (index + 1).toString(),
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold"
                },
                title: cp.address,
                passed: false
              })) || [];
            setCheckpointMarkers(markers);
          }
        }
      );
    } else {
      setPathCoords([{ lat: origin.lat, lng: origin.lng }]);
      setMarkerIndex(0);
      setCheckpointMarkers([]);
      setDirections(null);
    }
  }, [selectedVehicleIndex, vehicles]);

  useEffect(() => {
    if (!pathCoords.length || selectedVehicleIndex === null || !vehicles[selectedVehicleIndex]) return;

    const vehicle = vehicles[selectedVehicleIndex];
    const vehicleId = vehicle?.vehicleId;

    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
    }

    if (vehicle.vehicleType === "Bus" && pathCoords.length > 1) {
      movementIntervalRef.current = setInterval(() => {
        setMarkerIndex((prev) => {
          const next = prev + 1;

          if (vehicle.checkpoints) {
            vehicle.checkpoints.forEach((cp, index) => {
              if (cp?.position && !passedCheckpoints.includes(index)) {
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  new window.google.maps.LatLng(pathCoords[next]),
                  new window.google.maps.LatLng(cp.position)
                );

                if (distance < 50) {
                  setPassedCheckpoints(prev => [...prev, index]);
                  setCheckpointMarkers(prev =>
                    prev.map(m =>
                      m.position.lat === cp.position.lat && m.position.lng === cp.position.lng
                        ? { ...m, passed: true }
                        : m
                    )
                  );
                }
              }
            });
          }

          if (next >= pathCoords.length) {
            clearInterval(movementIntervalRef.current);
            return prev;
          }

          const livePosition = pathCoords[next];
          if (vehicleId) {
            update(ref(db, `vehicles/${vehicleId}`), {
              currentPosition: livePosition,
              lastUpdated: new Date().toISOString()
            });
          }

          return next;
        });
      }, 2000);
    } else {
      movementIntervalRef.current = setInterval(() => {
        if (vehicleId) {
          update(ref(db, `vehicles/${vehicleId}`), {
            lastUpdated: new Date().toISOString()
          });
        }
      }, 5000);
    }

    return () => {
      if (movementIntervalRef.current) {
        clearInterval(movementIntervalRef.current);
      }
    };
  }, [pathCoords, selectedVehicleIndex, vehicles, passedCheckpoints]);

  useEffect(() => {
    if (selectedVehicleIndex === null || !pathCoords.length || !pathCoords[markerIndex]) return;

    const geocoder = new window.google.maps.Geocoder();
    const latlng = {
      lat: pathCoords[markerIndex].lat,
      lng: pathCoords[markerIndex].lng
    };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        setCurrentAddress(results[0].formatted_address);
      }
    });
  }, [markerIndex, pathCoords, selectedVehicleIndex]);

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const filteredVehicles = vehicles
    .filter(vehicle => vehicle)
    .filter(vehicle => {
      const matchesSearch = vehicle.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "all" || vehicle.vehicleType === filter;
      return matchesSearch && matchesFilter;
    });

  const handleCallDriver = () => {
    const phoneNumber = vehicles[selectedVehicleIndex]?.driver?.contactNumber;
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const handleMessageDriver = () => {
    const phoneNumber = vehicles[selectedVehicleIndex]?.driver?.contactNumber;
    if (phoneNumber) {
      window.open(`sms:${phoneNumber}`);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-200 flex flex-col md:flex-row font-sans ${isModalOpen ? "backdrop-blur-sm" : ""}`}>
      {/* Sidebar */}
      <div className="relative bg-white w-full md:w-[470px] p-6 shadow-md flex flex-col md:h-screen overflow-hidden rounded-r-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Fleet Dashboard</h1>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Total Vehicles</p>
            <p className="text-2xl font-bold text-blue-800">{realTimeStats.totalVehicles}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-xs text-green-600 font-medium">Active Now</p>
            <p className="text-2xl font-bold text-green-800">{realTimeStats.activeVehicles}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <p className="text-xs text-orange-600 font-medium">Alerts</p>
            <p className="text-2xl font-bold text-orange-800">{realTimeStats.alerts}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-600 font-medium">Passengers</p>
            <p className="text-2xl font-bold text-purple-800">{realTimeStats.passengersToday}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search Vehicles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-full text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Bus">Bus</option>
            <option value="Truck">Truck</option>
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
          </select>
        </div>

        <div
          ref={scrollRef}
          className={`overflow-y-auto flex-1 pb-28 pr-1 transition-all duration-300 ${showScrollbar ? "" : "scrollbar-hidden"}`}
        >
          {filteredVehicles.map((vehicle) => {
            if (!vehicle) return null;

            return (
              <div
                key={vehicle.vehicleId}
                onClick={() => {
                  const vehicleIndex = vehicles.findIndex(v => v.vehicleId === vehicle.vehicleId);
                  if (vehicleIndex !== -1) {
                    setSelectedVehicleIndex(vehicleIndex);
                  }
                  setIsPanelExpanded(false);
                }}
                className={`bg-orange-50 border rounded-xl p-4 mb-4 hover:shadow-lg transition cursor-pointer ${selectedVehicleIndex !== null && vehicles[selectedVehicleIndex]?.vehicleId === vehicle.vehicleId
                    ? 'border-orange-500 shadow-md'
                    : 'border-orange-300'
                  } ${vehicle.alerts?.length > 0 ? 'bg-red-50 border-red-200' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">{vehicle.vehicleId}</p>
                    <p className="text-xs text-gray-500">
                      {vehicle.vehicleType} {vehicle.busType ? `(${vehicle.busType})` : ''}
                      {vehicle.carType ? `(${vehicle.carType})` : ''}
                      {vehicle.bikeType ? `(${vehicle.bikeType})` : ''}
                    </p>
                  </div>
                  <div className={`text-xs font-semibold px-3 py-1 rounded-full ${vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {vehicle.vehicleType === "Bus" && vehicle.checkpoints?.length > 0 ? `${vehicle.checkpoints.length} Stops` : 'Direct'}
                    {vehicle.alerts?.length > 0 && (
                      <span className="ml-1 text-red-500">
                        <AlertIcon className="inline" />
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {vehicle.from} {vehicle.vehicleType === "Bus" ? `→ ${vehicle.to}` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {vehicle.licensePlate && `Plate: ${vehicle.licensePlate} • `}
                  {vehicle.seatingCapacity && `Seats: ${vehicle.seatingCapacity} • `}
                  {vehicle.cargoCapacity && `Capacity: ${vehicle.cargoCapacity}kg • `}
                  {vehicle.fuelType}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(vehicle.lastUpdated).toLocaleTimeString()}
                </p>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateVehicle(vehicle);
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <EditIcon size={10} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVehicle(vehicle.vehicleId);
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <TrashIcon size={10} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-6">
          <button
            onClick={() => {
              setVehicleToUpdate(null);
              setIsModalOpen(true);
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Add New Vehicle
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative flex flex-col h-screen overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={6}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {selectedVehicleIndex !== null && vehicles[selectedVehicleIndex] && (
            <>
              {directions && <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: "#3b82f6",
                    strokeWeight: 5,
                    strokeOpacity: 0.8,
                  }
                }}
              />}

              {vehicles[selectedVehicleIndex]?.position && (
                <Marker
                  position={vehicles[selectedVehicleIndex].position}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  label="Start"
                />
              )}

              {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && vehicles[selectedVehicleIndex]?.destination && (
                <Marker
                  position={vehicles[selectedVehicleIndex].destination}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  label="End"
                />
              )}

              {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && checkpointMarkers.map((marker, index) => (
                <Marker
                  key={index}
                  position={marker.position}
                  icon={{
                    url: passedCheckpoints.includes(index)
                      ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                      : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new window.google.maps.Size(35, 35),
                  }}
                  label={marker.label}
                  title={marker.title}
                />
              ))}

              {pathCoords.length > 0 && markerIndex < pathCoords.length && (
                <Marker
                  position={pathCoords[markerIndex]}
                  icon={{
                    url: vehicleIcons[vehicles[selectedVehicleIndex].vehicleType] || vehicleIcons.Bus,
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  label={{
                    text: "LIVE",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "10px",
                    className: "bg-blue-500 px-1 rounded"
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>

        {/* Collapsible Info Panel */}
        {selectedVehicleIndex !== null && vehicles[selectedVehicleIndex] && (
          <AnimatePresence>
            {isPanelExpanded ? (
              <motion.div
                key="expanded-panel"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && <BusIcon className="h-6 w-6" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Car" && <CarIcon className="h-6 w-6" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Truck" && <TruckIcon className="h-6 w-6" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bike" && <BikeIcon className="h-6 w-6" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{vehicles[selectedVehicleIndex]?.vehicleId}</h2>
                        <p className="text-sm opacity-90">
                          {vehicles[selectedVehicleIndex]?.from}
                          {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && (
                            <span className="flex items-center">
                              <span className="mx-2">→</span>
                              {vehicles[selectedVehicleIndex]?.to}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {vehicles[selectedVehicleIndex]?.routeDistance && (
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <RouteIcon className="mr-1" /> {vehicles[selectedVehicleIndex]?.routeDistance}
                        </span>
                      )}
                      <button
                        onClick={togglePanel}
                        className="bg-white text-blue-600 p-1 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-x divide-gray-200">
                  {/* Driver Information */}
                  <div className="p-5">
                    <div className="flex items-center space-x-4 mb-5">
                      <div className="relative">
                        <img
                          className="w-14 h-14 rounded-full border-2 border-white shadow-md"
                          src="https://img.icons8.com/fluency/96/user-male-circle.png"
                          alt="Driver"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full p-1 border-2 border-white">
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {vehicles[selectedVehicleIndex]?.driver?.name || "Driver Name"}
                        </h3>
                        <p className="text-sm text-blue-600">Professional Driver</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <DetailCard
                          icon={<IdCardIcon className="h-4 w-4 text-blue-500" />}
                          title="Employee ID"
                          value={vehicles[selectedVehicleIndex]?.driver?.empId || "N/A"}
                          compact
                        />
                        <DetailCard
                          icon={<LicenseIcon className="h-4 w-4 text-blue-500" />}
                          title="DL Number"
                          value={vehicles[selectedVehicleIndex]?.driver?.dlNumber || "N/A"}
                          compact
                        />
                        <DetailCard
                          icon={<CalendarIcon className="h-4 w-4 text-blue-500" />}
                          title="Joining Date"
                          value={vehicles[selectedVehicleIndex]?.driver?.joiningDate || "N/A"}
                          compact
                        />
                        <DetailCard
                          icon={<PhoneIcon className="h-4 w-4 text-blue-500" />}
                          title="Contact"
                          value={vehicles[selectedVehicleIndex]?.driver?.contactNumber || "N/A"}
                          compact
                        />
                      </div>

                      <div className="pt-2 flex space-x-2">
                        <button
                          onClick={handleCallDriver}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          <span>Call</span>
                        </button>
                        <button
                          onClick={handleMessageDriver}
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                        >
                          <MessageIcon className="h-4 w-4" />
                          <span>Message</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Route Information (for Buses) */}
                  {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && (
                    <div className="p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <RouteIcon className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-700">Route Progress</h3>
                      </div>

                      <div className="mb-6">
                        <div className="relative h-2 bg-gray-200 rounded-full mb-1">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{ width: `${(markerIndex / pathCoords.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{new Date(vehicles[selectedVehicleIndex]?.startDate).toLocaleDateString()}</span>
                          <span>{new Date(vehicles[selectedVehicleIndex]?.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        <div className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg">
                          <div className="mt-1">
                            <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Departure</p>
                            <p className="text-sm text-gray-600">{vehicles[selectedVehicleIndex]?.from}</p>
                          </div>
                        </div>

                        {vehicles[selectedVehicleIndex]?.checkpoints?.map((checkpoint, index) => (
                          <div key={checkpoint.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="mt-1">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${passedCheckpoints.includes(index) ? "bg-green-500" : "bg-blue-400"
                                }`}>
                                <span className="text-xs text-white font-bold">{index + 1}</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Stop {index + 1}</p>
                              <p className="text-sm text-gray-600 truncate" title={checkpoint.address}>
                                {checkpoint.address}
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg">
                          <div className="mt-1">
                            <div className="h-5 w-5 rounded-full bg-blue-800 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Destination</p>
                            <p className="text-sm text-gray-600">{vehicles[selectedVehicleIndex]?.to}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Status */}
                  <div className="p-5">
                    <div className="flex items-center space-x-2 mb-4">
                      <GaugeIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-700">Vehicle Status</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DetailCard
                        icon={<GaugeIcon className="h-4 w-4 text-blue-500" />}
                        title="Speed"
                        value={`${vehicleMetrics.speed} km/h`}
                        status={vehicleMetrics.speed > 80 ? "warning" : "good"}
                        compact
                      />
                      <DetailCard
                        icon={<FuelIcon className="h-4 w-4 text-blue-500" />}
                        title="Fuel"
                        value={`${vehicleMetrics.fuel}%`}
                        progress={vehicleMetrics.fuel}
                        status={vehicleMetrics.fuel < 20 ? "warning" : "good"}
                        compact
                      />
                      <DetailCard
                        icon={<TemperatureIcon className="h-4 w-4 text-blue-500" />}
                        title="Engine Temp"
                        value={`${vehicleMetrics.engineTemp}°C`}
                        status={vehicleMetrics.engineTemp > 90 ? "warning" : "good"}
                        compact
                      />

                      {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && (
                        <>
                          <DetailCard
                            icon={<PassengerIcon className="h-4 w-4 text-blue-500" />}
                            title="Passengers"
                            value={`${vehicleMetrics.passengerCount}/${vehicles[selectedVehicleIndex]?.seatingCapacity || 'NA'}`}
                            status={
                              vehicleMetrics.passengerCount > (vehicles[selectedVehicleIndex]?.seatingCapacity || 0)
                                ? "warning"
                                : "good"
                            }
                            compact
                          />
                          <DetailCard
                            icon={<WifiIcon className="h-4 w-4 text-blue-500" />}
                            title="WiFi"
                            value={vehicleMetrics.wifiConnected ? "Connected" : "Offline"}
                            status={vehicleMetrics.wifiConnected ? "good" : "warning"}
                            compact
                          />
                          <DetailCard
                            icon={<AcIcon className="h-4 w-4 text-blue-500" />}
                            title="AC Status"
                            value={vehicleMetrics.acStatus ? "On" : "Off"}
                            status={
                              vehicles[selectedVehicleIndex]?.busType?.includes("AC") && !vehicleMetrics.acStatus
                                ? "warning"
                                : "neutral"
                            }
                            compact
                          />
                        </>
                      )}

                      <DetailCard
                        icon={<DoorIcon className="h-4 w-4 text-blue-500" />}
                        title="Doors"
                        value={vehicleMetrics.doorsOpen ? "Open" : "Closed"}
                        status={vehicleMetrics.doorsOpen ? "warning" : "good"}
                        compact
                      />
                      <DetailCard
                        icon={<EngineIcon className="h-4 w-4 text-blue-500" />}
                        title="Type"
                        value={
                          vehicles[selectedVehicleIndex]?.busType ||
                          vehicles[selectedVehicleIndex]?.carType ||
                          vehicles[selectedVehicleIndex]?.bikeType ||
                          "N/A"
                        }
                        compact
                      />
                    </div>

                    {(vehicleMetrics.alerts.length > 0) && (
                      <div className="mt-4 bg-red-50 rounded-lg p-3 border border-red-100">
                        <div className="flex items-start space-x-2">
                          <AlertIcon className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-700">Alerts</p>
                            <div className="space-y-1 mt-1">
                              {vehicleMetrics.alerts.map((alert, index) => (
                                <p key={index} className="text-xs text-red-600 flex items-center">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                  {alert}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md">
                      <SettingsIcon className="h-4 w-4" />
                      <span>Vehicle Diagnostics</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="minimized-panel"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
                onClick={togglePanel}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-white/20 p-1 rounded-lg">
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && <BusIcon className="h-4 w-4" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Car" && <CarIcon className="h-4 w-4" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Truck" && <TruckIcon className="h-4 w-4" />}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bike" && <BikeIcon className="h-4 w-4" />}
                      </div>
                      <h2 className="text-sm font-bold truncate max-w-[120px]">
                        {vehicles[selectedVehicleIndex]?.vehicleId}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      {vehicles[selectedVehicleIndex]?.routeDistance && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                          <RouteIcon className="mr-1 h-3 w-3" /> {vehicles[selectedVehicleIndex]?.routeDistance}
                        </span>
                      )}
                      <ChevronUpIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {vehicles[selectedVehicleIndex]?.from}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && (
                          <span className="mx-1">→</span>
                        )}
                        {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && vehicles[selectedVehicleIndex]?.to}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={currentAddress}>
                        {currentAddress || "Loading location..."}
                      </p>
                    </div>
                    {vehicles[selectedVehicleIndex]?.vehicleType === "Bus" && (
                      <div className="relative w-1/3 h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{ width: `${(markerIndex / pathCoords.length) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Speed: {vehicleMetrics.speed} km/h</span>
                    <span>Updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-start mt-20 bg-black/30">
          <AddVehicleModal
            onClose={() => {
              setIsModalOpen(false);
              setVehicleToUpdate(null);
            }}
            onSubmit={handleAddVehicle}
            vehicleToUpdate={vehicleToUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;