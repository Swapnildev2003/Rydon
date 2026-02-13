import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FaCheckCircle,
    FaMapMarkerAlt,
    FaCar,
    FaMotorcycle,
    FaUser,
    FaPhone,
    FaCalendarAlt,
    FaClock,
    FaArrowRight,
    FaHome,
    FaTicketAlt,
    FaStar
} from "react-icons/fa";

const BookingConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showAnimation, setShowAnimation] = useState(false);

    const {
        booking = {},
        vehicle = {},
        fromCity = "N/A",
        toCity = "N/A",
        totalBookings = 1,
        selectedService = "car" // car or bike
    } = location.state || {};

    const isBike = selectedService === "bike" || vehicle.vehicle_type === "bike" || vehicle.bike_type;
    const isCar = !isBike;

    useEffect(() => {
        setTimeout(() => setShowAnimation(true), 100);
    }, []);

    useEffect(() => {
        if (!location.state) {
            navigate("/user-booking");
        }
    }, [location.state, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = () => {
        return new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Car-specific styling
    const carConfig = {
        icon: <FaCar className="text-3xl text-white" />,
        gradient: "from-blue-500 to-indigo-600",
        lightBg: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-500",
        label: "Car",
        typeName: vehicle.car_type || "Sedan"
    };

    // Bike-specific styling
    const bikeConfig = {
        icon: <FaMotorcycle className="text-3xl text-white" />,
        gradient: "from-green-500 to-emerald-600",
        lightBg: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-500",
        label: "Bike",
        typeName: vehicle.bike_type || "Standard"
    };

    const config = isBike ? bikeConfig : carConfig;

    return (
        <div className={`min-h-screen ${isBike ? 'bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100'}`}>
            {/* Success Animation Overlay */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${showAnimation ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="text-center">
                    <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${isBike ? 'bg-green-100' : 'bg-blue-100'} flex items-center justify-center animate-pulse`}>
                        <FaCheckCircle className={`text-5xl ${isBike ? 'text-green-500' : 'text-blue-500'}`} />
                    </div>
                    <p className="text-xl font-semibold text-gray-700">
                        Confirming your {isBike ? 'bike' : 'car'} booking...
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-700 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Header */}
                <div className={`bg-gradient-to-r ${config.gradient} text-white py-12 px-6`}>
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            {config.icon}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {isBike ? 'Bike' : 'Car'} Booking Confirmed!
                        </h1>
                        <p className="text-white/90 text-lg">
                            Your {isBike ? 'bike ride' : 'car ride'} has been successfully booked
                        </p>
                        {totalBookings > 1 && (
                            <p className="text-white/80 text-sm mt-2">
                                Request sent to {totalBookings} nearby {isBike ? 'riders' : 'drivers'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Booking Details Card */}
                <div className="max-w-2xl mx-auto px-4 -mt-8">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Booking ID Header */}
                        <div className={`${config.lightBg} px-6 py-4 border-b flex items-center justify-between`}>
                            <div className="flex items-center">
                                <FaTicketAlt className={config.iconColor + " mr-2"} />
                                <span className="text-sm text-gray-500">Booking ID</span>
                            </div>
                            <span className="font-mono font-bold text-lg text-gray-800">
                                #{booking.booking_id || booking.id || Math.random().toString(36).substr(2, 9).toUpperCase()}
                            </span>
                        </div>

                        {/* Route Section */}
                        <div className="p-6 border-b">
                            <div className="flex items-start">
                                <div className="flex flex-col items-center mr-4">
                                    <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-green-100"></div>
                                    <div className={`w-0.5 h-16 ${isBike ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gradient-to-b from-green-500 to-blue-500'}`}></div>
                                    <div className={`w-4 h-4 rounded-full ${isBike ? 'bg-emerald-600' : 'bg-blue-500'} border-4 ${isBike ? 'border-emerald-100' : 'border-blue-100'}`}></div>
                                </div>
                                <div className="flex-1">
                                    <div className="mb-6">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pickup Location</p>
                                        <p className="text-lg font-semibold text-gray-800 flex items-center">
                                            <FaMapMarkerAlt className="text-green-500 mr-2" />
                                            {fromCity}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Drop Location</p>
                                        <p className="text-lg font-semibold text-gray-800 flex items-center">
                                            <FaMapMarkerAlt className={config.iconColor + " mr-2"} />
                                            {toCity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info - Car or Bike specific */}
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mr-4 shadow-lg`}>
                                        {config.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-lg">
                                            {config.typeName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {vehicle.license_plate || 'License Plate Pending'}
                                        </p>
                                        {isCar && vehicle.seating_capacity && (
                                            <p className="text-xs text-gray-400">{vehicle.seating_capacity} Seater</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center text-yellow-500">
                                        <FaStar className="mr-1" />
                                        <span className="font-semibold">4.8</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${config.lightBg} ${config.iconColor} font-medium mt-1 inline-block`}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>

                            {/* Driver/Rider Info */}
                            <div className="mt-4 pt-4 border-t flex items-center">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center mr-3`}>
                                    <FaUser className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                        {vehicle.driver?.name || (isBike ? 'Rider' : 'Driver') + ' will be assigned'}
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <FaPhone className="mr-1 text-xs" />
                                        {vehicle.driver?.contact_number || 'Contact will be shared shortly'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className={`p-6 ${config.lightBg} grid grid-cols-2 gap-4`}>
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center mr-3`}>
                                    <FaCalendarAlt className={config.iconColor} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Date</p>
                                    <p className="font-medium text-gray-800">{formatDate()}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center mr-3`}>
                                    <FaClock className={config.iconColor} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Time</p>
                                    <p className="font-medium text-gray-800">{formatTime()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="p-6 border-t">
                            <div className={`flex items-center justify-between ${isBike ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'} rounded-xl p-4 border`}>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${isBike ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse mr-3`}></div>
                                    <div>
                                        <p className={`font-medium ${isBike ? 'text-emerald-800' : 'text-blue-800'}`}>
                                            Waiting for {isBike ? 'Rider' : 'Driver'}
                                        </p>
                                        <p className={`text-sm ${isBike ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            {isBike ? 'Rider' : 'Driver'} will accept shortly
                                        </p>
                                    </div>
                                </div>
                                <div className={isBike ? 'text-emerald-500' : 'text-blue-500'}>
                                    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3 pb-8">
                        <button
                            onClick={() => navigate("/user-booking")}
                            className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${config.gradient} hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center`}
                        >
                            {isBike ? <FaMotorcycle className="mr-2" /> : <FaCar className="mr-2" />}
                            Book Another {isBike ? 'Bike' : 'Car'}
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-4 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
                        >
                            <FaHome className="mr-2" />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmation;
