import React, { useState, useRef, useEffect } from "react";

import {jwtDecode} from 'jwt-decode';
import {
  FaBus,
  FaCar,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaShuttleVan,
  FaUser,
  FaQuestionCircle,
  FaTicketAlt,
  FaChevronDown,
  FaChevronRight,
  FaArrowRight,
  FaTimes
} from "react-icons/fa";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { FaLocationArrow } from "react-icons/fa";
const RideNowUI = () => {
  const navigate = useNavigate();

  // State for search form
  const [selectedService, setSelectedService] = useState("bus");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState("");

  // State for booking flow
  const [showResults, setShowResults] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(5);
  const [nearbyVehicles, setNearbyVehicles] = useState([]);

  // Refs for autocomplete
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const fromAutocompleteRef = useRef(null);
  const toAutocompleteRef = useRef(null);
 const token = JSON.parse(localStorage.getItem('tokens')).access;
  const decoded = jwtDecode(token);
 
  const serviceTabs = [
    { id: "bus", label: "Bus", icon: <FaBus className="text-lg" /> },
    { id: "car", label: "Car", icon: <FaCar className="text-lg" /> },
    { id: "bike", label: "Bike", icon: <FaMotorcycle className="text-lg" /> },
  ];

  const vehicleTypes = {
    car: [
      { id: "hatchback", label: "Hatchback" },
      { id: "sedan", label: "Sedan" },
      { id: "suv", label: "SUV" },
      { id: "luxury", label: "Luxury" },
    ],
    bike: [
      { id: "scooter", label: "Scooter" },
      { id: "standard", label: "Standard Bike" },
      { id: "cruiser", label: "Cruiser" },
      { id: "sports", label: "Sports Bike" },
    ]
  };

  // Mock data for nearby vehicles
  const mockVehicles = [
    {
      id: "up300",
      type: "Bus",
      position: { lat: 28.6139, lng: 77.2090 },
      driver: "Rahul Sharma",
      rating: 4.8,
      eta: "5 min",
      fare: "₹350",
      acStatus: true,
      vehicleNumber: "UP 30 AB 1234",
      seats: 35,
      amenities: ["AC", "Charging Ports", "Water Bottle"]
    },
    {
      id: "dl100",
      type: "Car",
      position: { lat: 28.6140, lng: 77.2100 },
      driver: "Vikram Singh",
      rating: 4.5,
      eta: "3 min",
      fare: "₹250",
      acStatus: true,
      vehicleNumber: "DL 1C AB 5678",
      seats: 4,
      amenities: ["AC", "Music System"]
    },
    {
      id: "mh200",
      type: "Bike",
      position: { lat: 28.6125, lng: 77.2080 },
      driver: "Rajesh Kumar",
      rating: 4.2,
      eta: "7 min",
      fare: "₹150",
      acStatus: false,
      vehicleNumber: "MH 02 AB 9012",
      seats: 2,
      amenities: []
    }
  ];

  // Initialize autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (window.google && fromInputRef.current && toInputRef.current) {
        if (fromAutocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(fromAutocompleteRef.current);
        }
        if (toAutocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(toAutocompleteRef.current);
        }

        fromAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          fromInputRef.current,
          { types: ["(regions)"], componentRestrictions: { country: "in" } }
        );

        toAutocompleteRef.current = new window.google.maps.places.Autocomplete(
          toInputRef.current,
          { types: ["(regions)"], componentRestrictions: { country: "in" } }
        );

        fromAutocompleteRef.current.addListener("place_changed", () => {
          const place = fromAutocompleteRef.current.getPlace();
          if (place.geometry) {
            setFromCity(place.formatted_address);
            setMapCenter(place.geometry.location.toJSON());
            setMapZoom(14);
          }
        });

        toAutocompleteRef.current.addListener("place_changed", () => {
          const place = toAutocompleteRef.current.getPlace();
          if (place.formatted_address) {
            setToCity(place.formatted_address);
          }
        });
      }
    };

    if (window.google) {
      initAutocomplete();
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          initAutocomplete();
          clearInterval(timer);
        }
      }, 100);
    }

    return () => {
      if (fromAutocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(fromAutocompleteRef.current);
      }
      if (toAutocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(toAutocompleteRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    if (!fromCity || !toCity || !departureDate) {
      alert("Please fill all required fields");
      return;
    }

    // For car and bike, require vehicle type selection
    if ((selectedService === 'car' || selectedService === 'bike') && !selectedVehicleType) {
      alert(`Please select a ${selectedService} type`);
      return;
    }

    // Filter vehicles based on selected service type and vehicle type
    const filteredVehicles = mockVehicles.filter(v =>
      v.type.toLowerCase() === selectedService &&
      (selectedService === 'bus' || v.subType === selectedVehicleType)
    );

    if (selectedService === 'bus') {
      navigate('/bus-results', {
        state: {
          fromCity,
          toCity,
          departureDate,
          nearbyVehicles: filteredVehicles,
          mapCenter,
          mapZoom
        }
      });
    } else {
      navigate('/vehicle-results', {
        state: {
          user_id:decoded.user_id,
          fromCity,
          toCity,
          departureDate,
          nearbyVehicles: filteredVehicles,
          mapCenter,
          mapZoom,
          selectedService,
          vehicleType: selectedVehicleType
        }
      });
    }
  };

  const handleVehicleSelect = (vehicle) => {
    navigate('/book', {
      state: {
        selectedVehicle: vehicle,
        fromCity,
        toCity,
        departureDate,
        returnDate: isRoundTrip ? returnDate : null
      }
    });
  };

  const handlePopularRouteSelect = (from, to) => {
    setFromCity(from);
    setToCity(to);
    if (fromInputRef.current) fromInputRef.current.value = from;
    if (toInputRef.current) toInputRef.current.value = to;
  };

  const getVehicleIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'bus': return <FaBus className="text-lg" />;
      case 'car': return <FaCar className="text-lg" />;
      case 'bike': return <FaMotorcycle className="text-lg" />;
      default: return <FaBus className="text-lg" />;
    }
  };
 

console.log(decoded);
  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans relative overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 md:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold text-orange-600">RideNow</h1>
            <div className="flex flex-wrap gap-1">
              {serviceTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedService(tab.id);
                    setSelectedVehicleType("");
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all ${selectedService === tab.id
                    ? "bg-orange-100 text-orange-600 border border-orange-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
            <button
              onClick={() => navigate('/my-bookings')}
              className="flex items-center gap-1 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-50"
            >
              <FaTicketAlt className="text-base" />
              <span>My Bookings</span>
            </button>
            <button className="flex items-center gap-1 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-50">
              <FaQuestionCircle className="text-base" />
              <span>Help</span>
            </button>
            <button className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200">
              <FaUser className="text-base" />
              <span>Login / Signup</span>
              <FaChevronDown className="text-xs ml-1" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-16 px-4 text-center h-64 flex flex-col justify-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-3">Book {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Rides</h2>
            <p className="text-lg opacity-90">Quick • Easy • Safe • Reliable</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </section>

        {/* Search Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg -mt-16 p-8 relative z-10 border border-gray-100">
          {/* Trip Type Toggle */}
          <div className="mb-6 flex items-center gap-2 bg-gray-50 p-1 rounded-xl w-max">
            <button
              onClick={() => setIsRoundTrip(false)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${!isRoundTrip ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              One Way
            </button>
            <button
              onClick={() => setIsRoundTrip(true)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${isRoundTrip ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
            >
              Round Trip
            </button>
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* From Input */}
            <div className="relative col-span-1 md:col-span-2">
              <label htmlFor="from-city" className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                From
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-orange-300 transition-all focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                <FaMapMarkerAlt className="text-orange-500 mr-3 flex-shrink-0" />
                <input
                  id="from-city"
                  ref={fromInputRef}
                  type="text"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="City or Airport"
                  className="w-full bg-transparent outline-none text-base text-gray-800 placeholder-gray-400"
                  required
                />
                <div className="flex items-center">
                  {fromCity && (
                    <button
                      onClick={() => setFromCity('')}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                      aria-label="Clear from city"
                    >
                      <FaTimes />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            // Use Google Maps Geocoding API to get address from coordinates
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                              { location: { lat: latitude, lng: longitude } },
                              (results, status) => {
                                if (status === "OK" && results[0]) {
                                  setFromCity(results[0].formatted_address);
                                  if (fromInputRef.current) {
                                    fromInputRef.current.value = results[0].formatted_address;
                                  }
                                  setMapCenter({ lat: latitude, lng: longitude });
                                  setMapZoom(14);
                                } else {
                                  alert("Could not determine your location. Please try again or enter manually.");
                                }
                              }
                            );
                          },
                          (error) => {
                            alert(`Error getting location: ${error.message}`);
                          },
                          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                        );
                      } else {
                        alert("Geolocation is not supported by your browser");
                      }
                    }}
                    className="ml-2 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors"
                    aria-label="Use current location"
                    title="Use current location"
                  >
                    <FaLocationArrow className="text-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* To Input */}
            <div className="relative col-span-1 md:col-span-2">
              <label htmlFor="to-city" className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                To
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-orange-300 transition-all focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                <FaMapMarkerAlt className="text-green-500 mr-3 flex-shrink-0" />
                <input
                  id="to-city"
                  ref={toInputRef}
                  type="text"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="City or Airport"
                  className="w-full bg-transparent outline-none text-base text-gray-800 placeholder-gray-400"
                  required
                />
                {toCity && (
                  <button
                    onClick={() => setToCity('')}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                    aria-label="Clear to city"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Departure Date */}
            <div className="relative">
              <label htmlFor="departure-date" className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                Departure
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-orange-300 transition-all focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                <FaCalendarAlt className="text-purple-500 mr-3 flex-shrink-0" />
                <input
                  id="departure-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-base text-gray-800 appearance-none"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Return Date */}
            {isRoundTrip && (
              <div className="relative">
                <label htmlFor="return-date" className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Return
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-orange-300 transition-all focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                  <FaCalendarAlt className="text-blue-500 mr-3 flex-shrink-0" />
                  <input
                    id="return-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent outline-none text-base text-gray-800"
                    min={departureDate}
                    required
                  />
                </div>
              </div>
            )}

            {/* Vehicle Type Dropdown (shown only for car and bike) */}
            {(selectedService === 'car' || selectedService === 'bike') && (
              <div className="relative col-span-1 md:col-span-2">
                <label htmlFor="vehicle-type" className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  {selectedService === 'car' ? 'Car Type' : 'Bike Type'}
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white hover:border-orange-300 transition-all focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                  <select
                    id="vehicle-type"
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value)}
                    className="w-full bg-transparent outline-none text-base text-gray-800 appearance-none"
                    required
                  >
                    <option value="">Select {selectedService} type</option>
                    {vehicleTypes[selectedService].map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="text-gray-400 ml-2" />
                </div>
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="col-span-1 md:col-span-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl flex items-center justify-center px-6 py-4 transition-all shadow-md hover:shadow-lg active:scale-95 mt-2"
            >
              <FaSearch className="mr-3" />
              <span>Search {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Rides</span>
            </button>
          </div>
        </div>

        {/* Popular Routes */}
        <section className="max-w-5xl mx-auto mt-16 px-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Popular {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Routes
            </h3>
            <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center">
              View all <FaChevronRight className="ml-1 text-xs" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { from: "Delhi", to: "Jaipur", price: "₹1,299" },
              { from: "Mumbai", to: "Pune", price: "₹899" },
              { from: "Bangalore", to: "Chennai", price: "₹1,499" },
              { from: "Hyderabad", to: "Vijayawada", price: "₹1,099" },
            ].map((route, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:border-orange-300 transition-all cursor-pointer shadow-sm hover:shadow-md group"
                onClick={() => handlePopularRouteSelect(route.from, route.to)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                    {serviceTabs.find(tab => tab.id === selectedService)?.icon || <FaBus className="text-lg" />}
                  </div>
                  <span className="text-orange-500 font-medium">{route.price}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <p className="font-medium text-gray-800">{route.from}</p>
                  </div>
                  <div className="border-l-2 border-dashed border-gray-300 h-4 ml-[5px]"></div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="font-medium text-gray-800">{route.to}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Avg. duration: 5h 30m</span>
                  <button className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Book now <FaArrowRight className="ml-1 text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="max-w-6xl mx-auto mt-20 px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why RideNow is the Smart Choice</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're redefining travel in India with innovative solutions that put you first.
              Here's what sets us apart from the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Safety First */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Safety First</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verified drivers with background checks</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>24/7 ride tracking and SOS feature</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Regular vehicle maintenance checks</span>
                </li>
              </ul>
            </div>

            {/* Unmatched Convenience */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Unmatched Convenience</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Book in 30 seconds with our intuitive app</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Multiple payment options including UPI</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time tracking and ETAs</span>
                </li>
              </ul>
            </div>

            {/* Premium Comfort */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-purple-50 w-14 h-14 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Comfort</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Spacious, well-maintained vehicles</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Climate control in all premium vehicles</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complimentary water and WiFi on select rides</span>
                </li>
              </ul>
            </div>

            {/* Value for Money */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Value for Money</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 30% cheaper than competitors</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No surge pricing during peak hours</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Loyalty rewards and frequent discounts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl p-8 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10M+</div>
                <div className="text-sm opacity-90">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-sm opacity-90">Cities Covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-sm opacity-90">Customer Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">4.9★</div>
                <div className="text-sm opacity-90">Average Rating</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-10">What Our Customers Say</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "RideNow made my daily commute so much easier. The drivers are professional and the app is super intuitive.",
                  author: "Priya Sharma",
                  role: "Regular Commuter",
                  rating: 5
                },
                {
                  quote: "I travel frequently for work and RideNow consistently provides the most reliable service at the best prices.",
                  author: "Rahul Verma",
                  role: "Business Traveler",
                  rating: 5
                },
                {
                  quote: "As a senior citizen, I appreciate the safety features and helpful drivers. Highly recommended!",
                  author: "Mrs. Patel",
                  role: "Senior Citizen",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold mr-3">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">RideNow</h4>
            <p className="text-gray-400">Your trusted partner for all your travel needs across India.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              {serviceTabs.map(tab => (
                <li
                  key={tab.id}
                  className="hover:text-white cursor-pointer"
                  onClick={() => setSelectedService(tab.id)}
                >
                  {tab.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white cursor-pointer">About Us</li>
              <li className="hover:text-white cursor-pointer">Careers</li>
              <li className="hover:text-white cursor-pointer">Blog</li>
              <li className="hover:text-white cursor-pointer">Contact Us</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white cursor-pointer">Help Center</li>
              <li className="hover:text-white cursor-pointer">FAQs</li>
              <li className="hover:text-white cursor-pointer">Terms & Conditions</li>
              <li className="hover:text-white cursor-pointer">Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>© 2023 RideNow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RideNowUI;
