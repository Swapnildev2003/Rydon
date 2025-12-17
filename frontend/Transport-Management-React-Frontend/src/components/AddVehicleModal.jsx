import { Autocomplete, GoogleMap, DirectionsRenderer, Marker, Polyline } from "@react-google-maps/api";
import React, { useState, useRef, useEffect } from "react";

export default function AddVehicleModal({ onClose, onSubmit, vehicleToUpdate }) {
  // Form state with all necessary vehicle fields
  const [form, setForm] = useState({
    // Common fields for all vehicle types
    vehicleId: "",
    vehicleType: "Bus",
    from: "",
    driverId: "",
    status: "Active",
    lastUpdated: new Date().toISOString(),
    
    // Bus-specific fields
    busType: "AC Seater",
    seatingCapacity: 40,
    licensePlate: "",
    registrationNumber: "",
    fuelType: "Diesel",
    modelYear: new Date().getFullYear(),
    to: "",
    checkpoints: [],
    selectedRoute: null,
    startDate: "",
    endDate: "",
    routePolyline: "",
    routeDistance: "",
    routeDuration: "",
    
    // Truck-specific fields
    cargoCapacity: "",
    currentCargo: "",
    
    // Car-specific fields
    carType: "Sedan",
    
    // Bike-specific fields
    bikeType: "Scooter",
    
    // Driver fields
    driver: {
      name: "",
      dlNumber: "",
      contactNumber: "",
      empId: "",
      joiningDate: ""
    }
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [newCheckpoint, setNewCheckpoint] = useState("");
  const [checkpointError, setCheckpointError] = useState("");
  const [markerPositions, setMarkerPositions] = useState({
    origin: null,
    destination: null,
    checkpoints: []
  });
  const [pathCoordinates, setPathCoordinates] = useState([]);

  // Constants for dropdown options
  const vehicleTypes = ["Bus", "Truck", "Car", "Bike"];
  const busTypes = ["AC Seater", "Non-AC Seater", "Sleeper"];
  const truckCargoTypes = ["General", "Refrigerated", "Hazardous", "Liquid", "Construction"];
  const carTypes = ["Sedan", "SUV", "Hatchback", "Convertible"];
  const bikeTypes = ["Scooter", "Cruiser", "Sport", "Off-road"];
  const fuelTypes = ["Diesel", "Petrol", "CNG", "Electric", "Hybrid"];
  const statusOptions = ["Active", "Maintenance", "Inactive"];

  // Helper variables
  const isBus = form.vehicleType === "Bus";
  const isTruck = form.vehicleType === "Truck";
  const isCar = form.vehicleType === "Car";
  const isBike = form.vehicleType === "Bike";
  const isBusOrTruck = isBus || isTruck;

  // Refs
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const checkpointRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize form with vehicle data when editing
  useEffect(() => {
    if (vehicleToUpdate) {
      setForm({
        // Common fields
        vehicleId: vehicleToUpdate.vehicleId || "",
        vehicleType: vehicleToUpdate.vehicleType || "Bus",
        from: vehicleToUpdate.from || "",
        driverId: vehicleToUpdate.driverId || "",
        status: vehicleToUpdate.status || "Active",
        lastUpdated: vehicleToUpdate.lastUpdated || new Date().toISOString(),
        
        // Bus-specific fields
        busType: vehicleToUpdate.busType || "AC Seater",
        seatingCapacity: vehicleToUpdate.seatingCapacity || 40,
        licensePlate: vehicleToUpdate.licensePlate || "",
        registrationNumber: vehicleToUpdate.registrationNumber || "",
        fuelType: vehicleToUpdate.fuelType || "Diesel",
        modelYear: vehicleToUpdate.modelYear || new Date().getFullYear(),
        to: vehicleToUpdate.to || "",
        checkpoints: vehicleToUpdate.checkpoints || [],
        selectedRoute: vehicleToUpdate.selectedRoute || null,
        startDate: vehicleToUpdate.startDate || "",
        endDate: vehicleToUpdate.endDate || "",
        routePolyline: vehicleToUpdate.routePolyline || "",
        routeDistance: vehicleToUpdate.routeDistance || "",
        routeDuration: vehicleToUpdate.routeDuration || "",
        
        // Truck-specific fields
        cargoCapacity: vehicleToUpdate.cargoCapacity || "",
        currentCargo: vehicleToUpdate.currentCargo || "",
        
        // Car-specific fields
        carType: vehicleToUpdate.carType || "Sedan",
        
        // Bike-specific fields
        bikeType: vehicleToUpdate.bikeType || "Scooter",
        
        // Driver fields
        driver: {
          name: vehicleToUpdate.driver?.name || "",
          dlNumber: vehicleToUpdate.driver?.dlNumber || "",
          contactNumber: vehicleToUpdate.driver?.contactNumber || "",
          empId: vehicleToUpdate.driver?.empId || "",
          joiningDate: vehicleToUpdate.driver?.joiningDate || ""
        }
      });
    }
  }, [vehicleToUpdate]);

  // Initialize map and services
  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google) {
      console.error('Google Maps API is not loaded');
      alert('Google Maps is not available. Please refresh the page and try again.');
      return;
    }
    
    console.log('Google Maps API is available');
    
    if (isBus) {
      const service = new window.google.maps.DirectionsService();
      const renderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true
      });
      setDirectionsService(service);
      setDirectionsRenderer(renderer);
      console.log('Google Maps services initialized for bus routes');
    }
  }, [isBus]);

  // Geocode addresses to get coordinates
  const geocodeAddress = (address) => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error("Google Maps API not loaded");
        alert("Google Maps is not loaded. Please refresh the page.");
        resolve(null);
        return;
      }
      
      if (!address || address.trim() === '') {
        console.warn("Empty address provided for geocoding");
        resolve(null);
        return;
      }

      console.log("Geocoding address:", address);
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: address.trim() }, (results, status) => {
        console.log("Geocoding result:", { address, status, results });
        
        if (status === "OK" && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          console.log("✅ Geocoding successful:", location);
          resolve(location);
        } else {
          const errorMessage = `Geocoding failed for "${address}". Status: ${status}`;
          console.error(errorMessage);
          
          // Show user-friendly error messages
          if (status === "ZERO_RESULTS") {
            alert(`Location not found: "${address}". Please try a more specific address.`);
          } else if (status === "OVER_QUERY_LIMIT") {
            alert("Too many requests. Please try again in a moment.");
          } else if (status === "REQUEST_DENIED") {
            alert("Google Maps access denied. Please check your API key permissions.");
          } else {
            alert(`Unable to find location: "${address}". Please try a different address.`);
          }
          
          resolve(null);
        }
      });
    });
  };

  // Update marker positions when addresses change
  useEffect(() => {
    const updateMarkerPositions = async () => {
      try {
        const origin = await geocodeAddress(form.from);
        let destination = null;
        let checkpoints = [];

        if (isBus) {
          destination = await geocodeAddress(form.to);
          checkpoints = await Promise.all(
            form.checkpoints.map(cp => geocodeAddress(cp.address))
          );
        }

        setMarkerPositions({
          origin,
          destination,
          checkpoints: checkpoints.filter(pos => pos !== null)
        });

        const allPoints = [];
        if (origin) allPoints.push(origin);
        if (isBus) {
          if (destination) allPoints.push(destination);
          allPoints.push(...checkpoints.filter(pos => pos !== null));
        }
        setPathCoordinates(allPoints);
      } catch (error) {
        console.error("Error updating marker positions:", error);
      }
    };

    updateMarkerPositions();
  }, [form.from, form.to, form.checkpoints, isBus]);

  // Load routes when origin, destination, or checkpoints change (only for Bus)
  useEffect(() => {
    if (!isBus || !directionsService || !form.from || !form.to) return;

    const calculateRoutes = async () => {
      try {
        const waypoints = form.checkpoints.length > 0
          ? form.checkpoints.map(cp => ({
            location: cp.address,
            stopover: true
          }))
          : [];

        const results = await Promise.all([
          calculateRoute("DRIVING", waypoints),
        ]);

        const validRoutes = results.filter(r => r !== null);
        setRoutes(validRoutes);

        if (validRoutes.length > 0) {
          setForm(prev => ({
            ...prev,
            selectedRoute: validRoutes[0],
            routePolyline: validRoutes[0].overview_polyline?.points || "",
            routeDistance: validRoutes[0].legs[0]?.distance?.text || "",
            routeDuration: validRoutes[0].legs[0]?.duration?.text || ""
          }));

          if (validRoutes[0].overview_path) {
            const coords = validRoutes[0].overview_path.map(point => ({
              lat: point.lat(),
              lng: point.lng()
            }));
            setPathCoordinates(coords);
          }
        }
      } catch (error) {
        console.error("Error calculating routes:", error);
      }
    };

    calculateRoutes();
  }, [form.from, form.to, form.checkpoints, directionsService, isBus]);

  const calculateRoute = (travelMode, waypoints = []) => {
    return new Promise((resolve) => {
      directionsService.route(
        {
          origin: form.from,
          destination: form.to,
          travelMode: travelMode,
          provideRouteAlternatives: true,
          waypoints: waypoints,
          optimizeWaypoints: true,
        },
        (response, status) => {
          if (status === "OK") {
            let totalDistance = 0;
            let totalDuration = 0;

            response.routes[0].legs.forEach(leg => {
              totalDistance += leg.distance.value;
              totalDuration += leg.duration.value;
            });

            const modifiedRoute = {
              ...response.routes[0],
              legs: [{
                distance: {
                  text: `${(totalDistance / 1000).toFixed(1)} km`,
                  value: totalDistance
                },
                duration: {
                  text: `${Math.floor(totalDuration / 60)} min`,
                  value: totalDuration
                }
              }]
            };

            resolve(modifiedRoute);
          } else {
            console.error("Directions request failed:", status);
            resolve(null);
          }
        }
      );
    });
  };

  const handleMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  };

  const handleRouteSelect = (route) => {
    if (!isBus) return;

    setForm(prev => ({
      ...prev,
      selectedRoute: route,
      routePolyline: route.overview_polyline?.points || "",
      routeDistance: route.legs[0]?.distance?.text || "",
      routeDuration: route.legs[0]?.duration?.text || ""
    }));

    if (directionsRenderer && map) {
      directionsRenderer.setDirections({
        routes: [route],
        request: {
          origin: form.from,
          destination: form.to,
          travelMode: "DRIVING",
        },
      });
      directionsRenderer.setMap(map);

      if (route.overview_path) {
        const coords = route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));
        setPathCoordinates(coords);
      }

      const bounds = new window.google.maps.LatLngBounds();
      route.legs.forEach(leg => {
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      });
      map.fitBounds(bounds);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("driver.")) {
      const driverField = name.split(".")[1];
      setForm(prev => ({
        ...prev,
        driver: {
          ...prev.driver,
          [driverField]: value
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    if (name === "vehicleType") {
      const isNowBus = value === "Bus";
      const wasBus = form.vehicleType === "Bus";
      
      if (wasBus && !isNowBus) {
        setForm(prev => ({
          ...prev,
          to: "",
          selectedRoute: null,
          checkpoints: [],
          routePolyline: "",
          routeDistance: "",
          routeDuration: ""
        }));
      }
    }
  };

  const addCheckpoint = () => {
    if (!isBus) return;
    
    if (!newCheckpoint) {
      setCheckpointError("Please enter a checkpoint address");
      return;
    }

    if (form.checkpoints.some(cp => cp.address === newCheckpoint)) {
      setCheckpointError("This checkpoint already exists");
      return;
    }

    setForm(prev => ({
      ...prev,
      checkpoints: [
        ...prev.checkpoints,
        {
          address: newCheckpoint,
          id: Date.now().toString()
        }
      ]
    }));

    setNewCheckpoint("");
    setCheckpointError("");
  };

  const removeCheckpoint = (id) => {
    setForm(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter(cp => cp.id !== id)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Common validation for all vehicle types
    if (!form.vehicleId) newErrors.vehicleId = "Vehicle ID is required";
    if (!form.from) newErrors.from = "Location is required";
    if (!form.driver.name) newErrors["driver.name"] = "Driver name is required";
    if (!form.driver.dlNumber) newErrors["driver.dlNumber"] = "DL number is required";
    if (!form.driver.contactNumber) newErrors["driver.contactNumber"] = "Contact number is required";
    if (!form.driver.empId) newErrors["driver.empId"] = "Employee ID is required";
    
    // Bus-specific validation
    if (isBus) {
      if (!form.to) newErrors.to = "Destination is required";
      if (!form.licensePlate) newErrors.licensePlate = "License plate is required";
      if (!form.registrationNumber) newErrors.registrationNumber = "Registration number is required";
      if (!form.selectedRoute) newErrors.route = "Please select a route";
    }
    
    // Truck-specific validation
    if (isTruck) {
      if (!form.cargoCapacity) newErrors.cargoCapacity = "Cargo capacity is required";
      if (!form.licensePlate) newErrors.licensePlate = "License plate is required";
      if (!form.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    }
    
    // Car-specific validation
    if (isCar) {
      if (!form.licensePlate) newErrors.licensePlate = "License plate is required";
      if (!form.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    }
    
    // Bike-specific validation
    if (isBike) {
      if (!form.licensePlate) newErrors.licensePlate = "License plate is required";
      if (!form.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    }

    // Validation for Bus and Truck
    if (isBusOrTruck) {
      if (!form.startDate) newErrors.startDate = "Start date is required";
      if (!form.endDate) newErrors.endDate = "End date is required";
      if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const vehicleData = {
        vehicleId: form.vehicleId,
        vehicleType: form.vehicleType,
        from: form.from,
        driverId: form.driverId || `driver_${Date.now()}`,
        driver: {
          name: form.driver.name,
          dlNumber: form.driver.dlNumber,
          contactNumber: form.driver.contactNumber,
          empId: form.driver.empId,
          joiningDate: form.driver.joiningDate
        },
        status: form.status,
        lastUpdated: form.lastUpdated,
        createdAt: vehicleToUpdate ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      
      };

      // Add bus-specific fields
      if (isBus) {
        vehicleData.busType = form.busType;
        vehicleData.seatingCapacity = form.seatingCapacity;
        vehicleData.licensePlate = form.licensePlate;
        vehicleData.registrationNumber = form.registrationNumber;
        vehicleData.fuelType = form.fuelType;
        vehicleData.modelYear = form.modelYear;
        vehicleData.to = form.to;
        vehicleData.checkpoints = form.checkpoints.map((cp, index) => ({
          ...cp,
          order: index + 1
        }));
        vehicleData.routePolyline = form.routePolyline;
        vehicleData.routeDistance = form.routeDistance;
        vehicleData.routeDuration = form.routeDuration;
        vehicleData.startDate = form.startDate;
        vehicleData.endDate = form.endDate;
        
        // For buses, set the actual distance and duration from the selected route
        vehicleData.distance = form.routeDistance;
        vehicleData.duration = form.routeDuration;
      }

      // Add truck-specific fields
      if (isTruck) {
        vehicleData.cargoCapacity = form.cargoCapacity;
        vehicleData.currentCargo = form.currentCargo;
        vehicleData.licensePlate = form.licensePlate;
        vehicleData.registrationNumber = form.registrationNumber;
        vehicleData.fuelType = form.fuelType;
        vehicleData.modelYear = form.modelYear;
        vehicleData.startDate = form.startDate;
        vehicleData.endDate = form.endDate;
        
        // For trucks, you might want to calculate distance if they have a route
        // Or leave as null if they don't have fixed routes
        vehicleData.distance = null; // or calculate if applicable
        vehicleData.duration = null; // or calculate if applicable
      }

      // Add car-specific fields
      if (isCar) {
        vehicleData.carType = form.carType;
        vehicleData.licensePlate = form.licensePlate;
        vehicleData.registrationNumber = form.registrationNumber;
        vehicleData.fuelType = form.fuelType;
        vehicleData.modelYear = form.modelYear;
        
        // Cars typically don't have fixed routes, so leave as null
        vehicleData.distance = null;
        vehicleData.duration = null;
      }

      // Add bike-specific fields
      if (isBike) {
        vehicleData.bikeType = form.bikeType;
        vehicleData.licensePlate = form.licensePlate;
        vehicleData.registrationNumber = form.registrationNumber;
        vehicleData.fuelType = form.fuelType;
        vehicleData.modelYear = form.modelYear;
        
        // Bikes typically don't have fixed routes, so leave as null
        vehicleData.distance = null;
        vehicleData.duration = null;
      }

      await onSubmit(vehicleData);
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl overflow-hidden">
        <div className="bg-orange-400 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {vehicleToUpdate ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle ID <span className="text-red-500">*</span>
              </label>
              <input
                name="vehicleId"
                placeholder="UP 61 E 2829"
                className={`w-full px-3 py-2 border rounded-md ${errors.vehicleId ? 'border-red-500' : 'border-gray-300'}`}
                value={form.vehicleId}
                onChange={handleChange}
              />
              {errors.vehicleId && <p className="mt-1 text-sm text-red-500">{errors.vehicleId}</p>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Type-specific fields */}
            {isBus && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="busType"
                    value={form.busType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {busTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seating Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="seatingCapacity"
                    className={`w-full px-3 py-2 border rounded-md ${errors.seatingCapacity ? 'border-red-500' : 'border-gray-300'}`}
                    value={form.seatingCapacity}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.seatingCapacity && <p className="mt-1 text-sm text-red-500">{errors.seatingCapacity}</p>}
                </div>
              </>
            )}

            {isTruck && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo Capacity (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="cargoCapacity"
                    className={`w-full px-3 py-2 border rounded-md ${errors.cargoCapacity ? 'border-red-500' : 'border-gray-300'}`}
                    value={form.cargoCapacity}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.cargoCapacity && <p className="mt-1 text-sm text-red-500">{errors.cargoCapacity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Cargo Type
                  </label>
                  <select
                    name="currentCargo"
                    value={form.currentCargo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select cargo type</option>
                    {truckCargoTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {isCar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="carType"
                  value={form.carType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {carTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {isBike && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bike Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="bikeType"
                  value={form.bikeType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {bikeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Common vehicle fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate <span className="text-red-500">*</span>
              </label>
              <input
                name="licensePlate"
                className={`w-full px-3 py-2 border rounded-md ${errors.licensePlate ? 'border-red-500' : 'border-gray-300'}`}
                value={form.licensePlate}
                onChange={handleChange}
              />
              {errors.licensePlate && <p className="mt-1 text-sm text-red-500">{errors.licensePlate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                name="registrationNumber"
                className={`w-full px-3 py-2 border rounded-md ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'}`}
                value={form.registrationNumber}
                onChange={handleChange}
              />
              {errors.registrationNumber && <p className="mt-1 text-sm text-red-500">{errors.registrationNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type <span className="text-red-500">*</span>
              </label>
              <select
                name="fuelType"
                value={form.fuelType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {fuelTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="modelYear"
                className={`w-full px-3 py-2 border rounded-md ${errors.modelYear ? 'border-red-500' : 'border-gray-300'}`}
                value={form.modelYear}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
              />
              {errors.modelYear && <p className="mt-1 text-sm text-red-500">{errors.modelYear}</p>}
            </div>

            {/* Start Date - Only for Bus and Truck */}
            {isBusOrTruck && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  className={`w-full px-3 py-2 border rounded-md ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.startDate}
                  onChange={handleChange}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>
            )}

            {/* End Date - Only for Bus and Truck */}
            {isBusOrTruck && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  className={`w-full px-3 py-2 border rounded-md ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.endDate}
                  onChange={handleChange}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
            )}

            {/* From (Origin/Location) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBus ? "Origin" : "Location"} <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                onLoad={(ref) => {
                  console.log('From autocomplete loaded:', ref);
                  fromRef.current = ref;
                }}
                onPlaceChanged={() => {
                  console.log('From place changed');
                  try {
                    const place = fromRef.current.getPlace();
                    console.log('From place object:', place);
                    
                    if (!place || !place.geometry) {
                      console.error('Invalid place object for From location');
                      alert('Please select a valid location from the dropdown suggestions.');
                      return;
                    }
                    
                    const address = place.formatted_address || place.name;
                    console.log('From address selected:', address);
                    setForm(prev => ({ ...prev, from: address }));
                    setErrors(prev => ({ ...prev, from: null }));
                  } catch (error) {
                    console.error('Error handling From place selection:', error);
                    alert('Error selecting location. Please try again.');
                  }
                }}
                restrictions={{
                  country: ['IN'] // Restrict to India for better results
                }}
              >
                <input
                  type="text"
                  placeholder={isBus ? "Enter origin location" : "Enter vehicle location"}
                  className={`w-full px-3 py-2 border rounded-md ${errors.from ? 'border-red-500' : 'border-gray-300'}`}
                  defaultValue={form.from}
                />
              </Autocomplete>
              {errors.from && <p className="mt-1 text-sm text-red-500">{errors.from}</p>}
            </div>

            {/* To (Destination) - Only for Bus */}
            {isBus && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  onLoad={(ref) => {
                    console.log('To autocomplete loaded:', ref);
                    toRef.current = ref;
                  }}
                  onPlaceChanged={() => {
                    console.log('To place changed');
                    try {
                      const place = toRef.current.getPlace();
                      console.log('To place object:', place);
                      
                      if (!place || !place.geometry) {
                        console.error('Invalid place object for To location');
                        alert('Please select a valid location from the dropdown suggestions.');
                        return;
                      }
                      
                      const address = place.formatted_address || place.name;
                      console.log('To address selected:', address);
                      setForm(prev => ({ ...prev, to: address }));
                      setErrors(prev => ({ ...prev, to: null }));
                    } catch (error) {
                      console.error('Error handling To place selection:', error);
                      alert('Error selecting location. Please try again.');
                    }
                  }}
                  restrictions={{
                    country: ['IN'] // Restrict to India for better results
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter destination location"
                    className={`w-full px-3 py-2 border rounded-md ${errors.to ? 'border-red-500' : 'border-gray-300'}`}
                    defaultValue={form.to}
                  />
                </Autocomplete>
                {errors.to && <p className="mt-1 text-sm text-red-500">{errors.to}</p>}
              </div>
            )}

            {/* Driver Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name <span className="text-red-500">*</span>
              </label>
              <input
                name="driver.name"
                placeholder="Full name"
                className={`w-full px-3 py-2 border rounded-md ${errors['driver.name'] ? 'border-red-500' : 'border-gray-300'}`}
                value={form.driver.name}
                onChange={handleChange}
              />
              {errors['driver.name'] && <p className="mt-1 text-sm text-red-500">{errors['driver.name']}</p>}
            </div>

            {/* DL Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver License Number <span className="text-red-500">*</span>
              </label>
              <input
                name="driver.dlNumber"
                placeholder="DL number"
                className={`w-full px-3 py-2 border rounded-md ${errors['driver.dlNumber'] ? 'border-red-500' : 'border-gray-300'}`}
                value={form.driver.dlNumber}
                onChange={handleChange}
              />
              {errors['driver.dlNumber'] && <p className="mt-1 text-sm text-red-500">{errors['driver.dlNumber']}</p>}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                name="driver.contactNumber"
                placeholder="Phone number"
                className={`w-full px-3 py-2 border rounded-md ${errors['driver.contactNumber'] ? 'border-red-500' : 'border-gray-300'}`}
                value={form.driver.contactNumber}
                onChange={handleChange}
              />
              {errors['driver.contactNumber'] && <p className="mt-1 text-sm text-red-500">{errors['driver.contactNumber']}</p>}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                name="driver.empId"
                placeholder="Employee ID"
                className={`w-full px-3 py-2 border rounded-md ${errors['driver.empId'] ? 'border-red-500' : 'border-gray-300'}`}
                value={form.driver.empId}
                onChange={handleChange}
              />
              {errors['driver.empId'] && <p className="mt-1 text-sm text-red-500">{errors['driver.empId']}</p>}
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                name="driver.joiningDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={form.driver.joiningDate}
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkpoints Section - Only for Bus */}
          {isBus && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Add Checkpoints</h3>

              <div className="flex gap-2 mb-3">
                <Autocomplete
                  onLoad={(ref) => {
                    console.log('Checkpoint autocomplete loaded:', ref);
                    checkpointRef.current = ref;
                  }}
                  onPlaceChanged={() => {
                    console.log('Checkpoint place changed');
                    try {
                      const place = checkpointRef.current.getPlace();
                      console.log('Checkpoint place object:', place);
                      
                      if (!place || !place.geometry) {
                        console.error('Invalid place object for Checkpoint');
                        alert('Please select a valid checkpoint location from the dropdown suggestions.');
                        return;
                      }
                      
                      const address = place.formatted_address || place.name;
                      console.log('Checkpoint address selected:', address);
                      setNewCheckpoint(address);
                      setCheckpointError("");
                    } catch (error) {
                      console.error('Error handling Checkpoint place selection:', error);
                      alert('Error selecting checkpoint location. Please try again.');
                    }
                  }}
                  restrictions={{
                    country: ['IN'] // Restrict to India for better results
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter checkpoint location"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={newCheckpoint}
                    onChange={(e) => setNewCheckpoint(e.target.value)}
                  />
                </Autocomplete>
                <button
                  type="button"
                  onClick={addCheckpoint}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              {checkpointError && <p className="text-sm text-red-500 mb-2">{checkpointError}</p>}

              {form.checkpoints.length > 0 && (
                <div className="space-y-2 mb-4">
                  {form.checkpoints.map((checkpoint) => (
                    <div key={checkpoint.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm">{checkpoint.address}</span>
                      <button
                        type="button"
                        onClick={() => removeCheckpoint(checkpoint.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Route Selection Section - Only for Bus */}
          {isBus && form.from && form.to && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Select Route</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Route Options */}
                <div className="space-y-3">
                  {routes.map((route, index) => {
                    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
                    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

                    return (
                      <div
                        key={index}
                        onClick={() => handleRouteSelect(route)}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${form.selectedRoute === route ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {index === 0 ? "Recommended Route" : "Alternative Route"}
                          </span>
                          <span className="text-sm text-gray-600">
                            {`${(totalDistance / 1000).toFixed(1)} km`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {`${Math.floor(totalDuration / 60)} min`}
                        </div>
                        {form.checkpoints.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {form.checkpoints.length} checkpoint{form.checkpoints.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {routes.length === 0 && form.from && form.to && (
                    <div className="text-gray-500 text-sm">
                      Calculating routes...
                    </div>
                  )}
                  {errors.route && <p className="mt-1 text-sm text-red-500">{errors.route}</p>}
                </div>

                {/* Map Display */}
                <div className="lg:col-span-2 h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-full w-full">
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={markerPositions.origin || { lat: 20.5937, lng: 78.9629 }}
                      zoom={6}
                      onLoad={handleMapLoad}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      {/* Route Line */}
                      {pathCoordinates.length > 1 && (
                        <Polyline
                          path={pathCoordinates}
                          options={{
                            strokeColor: "#3b82f6",
                            strokeOpacity: 0.8,
                            strokeWeight: 5,
                            geodesic: true
                          }}
                        />
                      )}

                      {/* Origin Marker */}
                      {markerPositions.origin && (
                        <Marker
                          position={markerPositions.origin}
                          title={isBus ? "Origin" : "Location"}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                            scaledSize: new window.google.maps.Size(40, 40),
                          }}
                        />
                      )}

                      {/* Destination Marker */}
                      {markerPositions.destination && (
                        <Marker
                          position={markerPositions.destination}
                          title="Destination"
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            scaledSize: new window.google.maps.Size(40, 40),
                          }}
                        />
                      )}

                      {/* Checkpoint Markers */}
                      {markerPositions.checkpoints.map((position, index) => (
                        <Marker
                          key={form.checkpoints[index]?.id || index}
                          position={position}
                          title={`Checkpoint ${index + 1}`}
                          label={`${index + 1}`}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            scaledSize: new window.google.maps.Size(30, 30),
                          }}
                        />
                      ))}
                    </GoogleMap>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? 'Saving...' : vehicleToUpdate ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}