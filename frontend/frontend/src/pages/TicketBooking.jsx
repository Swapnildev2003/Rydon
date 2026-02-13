import React, { useState } from "react";
import {
  FaArrowLeft,
  FaBus,
  FaCar,
  FaMotorcycle,
  FaShuttleVan,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChair,
  FaRupeeSign,
  FaUsers,
  FaUserAlt,
  FaInfoCircle
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TicketBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const vehicleData = location.state?.selectedVehicle || location.state?.selectedBus;
  const { fromCity = "", toCity = "", departureDate = "" } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  if (!vehicleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Booking Error</h2>
          <p className="mb-6 text-gray-600">
            No vehicle selected. Please return to the selection page to choose your preferred vehicle.
          </p>
          <button
            onClick={() => navigate('/ride')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 ease-in-out shadow-sm"
          >
            Return to Vehicle Selection
          </button>
        </motion.div>
      </div>
    );
  }

  const getVehicleIconComponent = (type) => {
    const vehicleType = (type || 'car').toLowerCase();
    switch(vehicleType) {
      case 'bus': return <FaBus className="text-xl" />;
      case 'car': return <FaCar className="text-xl" />;
      case 'auto': return <FaShuttleVan className="text-xl" />;
      case 'bike': return <FaMotorcycle className="text-xl" />;
      default: return <FaCar className="text-xl" />;
    }
  };

  const getVehicleTypeName = (type) => {
    const vehicleType = (type || 'car').toLowerCase();
    switch(vehicleType) {
      case 'bus': return 'Bus';
      case 'car': return 'Private Car';
      case 'auto': return 'Auto Rickshaw';
      case 'bike': return 'Motorcycle';
      default: return 'Vehicle';
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!passengerName.trim()) {
      errors.passengerName = "Please enter your full name";
    }
    
    if (!mobileNumber.trim()) {
      errors.mobileNumber = "Please enter your mobile number";
    } else if (!/^\d{10}$/.test(mobileNumber)) {
      errors.mobileNumber = "Please enter a valid 10-digit number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const initiateUpiPayment = async () => {
    if (!validateForm()) return;

    setPaymentProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const txnId = `TXN${Math.floor(10000000 + Math.random() * 90000000)}`;
      setTransactionId(txnId);
      
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setBookingConfirmed(true);
          setPaymentProcessing(false);
        }, 1500);
      } else {
        setPaymentSuccess(false);
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentSuccess(false);
      setPaymentProcessing(false);
    }
  };

  const handleBookRide = () => {
    if (paymentMethod === "upi") {
      initiateUpiPayment();
    } else {
      if (!validateForm()) return;
      setBookingConfirmed(true);
    }
  };

  const getFareDisplay = () => {
    if (vehicleData.type.toLowerCase() === 'bus' && vehicleData.totalPrice) {
      return `${vehicleData.totalPrice}`;
    }
    return vehicleData.fare ? `₹${vehicleData.fare}` : "N/A";
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-50 mr-2 transition-colors duration-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Confirm Your Booking</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pb-10">
        {/* Step Indicator */}
        {!bookingConfirmed && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      activeStep >= step 
                        ? 'bg-blue-600 text-white shadow-inner' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      activeStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {!bookingConfirmed ? (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-6"
          >
            {/* Trip Summary */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                  {getVehicleIconComponent(vehicleData.type)}
                </div>
                <h2 className="text-md font-semibold text-gray-800">Trip Summary</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">
                      {getVehicleTypeName(vehicleData.type)} - {vehicleData.vehicleNumber}
                    </h3>
                    <p className="text-gray-600 text-sm">Driver: {vehicleData.driver}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(vehicleData.rating) 
                              ? 'text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({vehicleData.rating})</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <span className="font-semibold text-blue-600 text-md">
                      {getFareDisplay()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                        <FaMapMarkerAlt className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="font-medium text-sm">{fromCity}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                        <FaMapMarkerAlt className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="font-medium text-sm">{toCity}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                        <FaCalendarAlt className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium text-sm">
                          {formatDate(departureDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Seats - Only for buses */}
                {vehicleData.type.toLowerCase() === 'bus' && vehicleData.selectedSeats && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 flex items-center text-gray-700 text-sm">
                      <FaChair className="mr-2 text-blue-600" />
                      Selected Seats ({vehicleData.seatsBooked || vehicleData.selectedSeats.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {vehicleData.selectedSeats.map((seat, index) => (
                        <div 
                          key={index} 
                          className="bg-blue-50 px-2.5 py-1 rounded-full text-xs flex items-center border border-blue-100"
                        >
                          <span className="font-medium text-blue-800">Seat {seat.number}</span>
                          <span className="ml-1.5 text-blue-600 flex items-center">
                            <FaRupeeSign className="mr-0.5" />{seat.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Passenger Details */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-200"
              onFocus={() => setActiveStep(2)}
            >
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                  <FaUserAlt className="text-sm" />
                </div>
                <h2 className="text-md font-semibold text-gray-800">Passenger Details</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 text-sm ${
                      formErrors.passengerName 
                        ? 'border-red-400 focus:ring-red-300' 
                        : 'border-gray-300 focus:ring-blue-300 focus:border-blue-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.passengerName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FaInfoCircle className="mr-1" /> {formErrors.passengerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 text-sm ${
                      formErrors.mobileNumber 
                        ? 'border-red-400 focus:ring-red-300' 
                        : 'border-gray-300 focus:ring-blue-300 focus:border-blue-400'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                  />
                  {formErrors.mobileNumber && (
                    <p className="mt-1 text-xs text-red-500 flex items-center">
                      <FaInfoCircle className="mr-1" /> {formErrors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Payment Options */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-200"
              onFocus={() => setActiveStep(3)}
            >
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                  <FaMoneyBillWave className="text-sm" />
                </div>
                <h2 className="text-md font-semibold text-gray-800">Payment Method</h2>
              </div>
              
              <div className="space-y-3">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 border rounded-lg cursor-pointer flex items-center transition ${
                    paymentMethod === "cash" 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-3">
                    <FaMoneyBillWave className="text-sm" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">Pay in Cash</h3>
                    <p className="text-xs text-gray-600">Pay directly to the driver</p>
                  </div>
                  {paymentMethod === "cash" && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaCheckCircle className="text-white text-xxs" />
                    </div>
                  )}
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-3 border rounded-lg cursor-pointer flex items-center transition ${
                    paymentMethod === "upi" 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                    <FaMobileAlt className="text-sm" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">UPI Payment</h3>
                    <p className="text-xs text-gray-600">Pay using UPI apps like Google Pay, PhonePe</p>
                  </div>
                  {paymentMethod === "upi" && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaCheckCircle className="text-white text-xxs" />
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Book Now Button */}
            <motion.div 
              variants={fadeIn}
              className="sticky bottom-4 z-10"
            >
              <button
                onClick={handleBookRide}
                disabled={paymentProcessing}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition duration-200 ease-in-out ${
                  paymentProcessing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {paymentMethod === "upi" ? "Proceed to UPI Payment" : "Confirm Booking"}
              </button>
            </motion.div>

            {/* Payment Processing Modal */}
            <AnimatePresence>
              {paymentProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-5 rounded-lg max-w-xs w-full mx-4 shadow-xl"
                  >
                    <h3 className="text-md font-semibold mb-3 text-center text-gray-800">
                      Processing UPI Payment
                    </h3>
                    <div className="flex justify-center mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="text-center text-gray-600 text-sm">
                      Please complete the payment in your UPI app...
                    </p>
                    <div className="mt-3 bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Amount:</p>
                      <p className="font-medium text-blue-600">{getFareDisplay()}</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Result Modal */}
            <AnimatePresence>
              {paymentSuccess !== null && !paymentProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-5 rounded-lg max-w-xs w-full mx-4 shadow-xl"
                  >
                    <div className="flex justify-center mb-3">
                      {paymentSuccess ? (
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                          <FaCheckCircle className="text-green-500 text-3xl" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                          <FaTimesCircle className="text-red-500 text-3xl" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">
                      {paymentSuccess ? "Payment Successful!" : "Payment Failed"}
                    </h3>
                    {paymentSuccess && (
                      <p className="text-center text-gray-600 mb-3 text-xs">
                        Transaction ID: <span className="font-mono">{transactionId}</span>
                      </p>
                    )}
                    <p className="text-center text-gray-600 mb-4 text-sm">
                      {paymentSuccess 
                        ? "Your booking has been confirmed!" 
                        : "The payment couldn't be processed. Please try again."}
                    </p>
                    <button
                      onClick={() => {
                        setPaymentSuccess(null);
                        if (!paymentSuccess) return;
                        setBookingConfirmed(true);
                      }}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-white text-sm ${
                        paymentSuccess 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {paymentSuccess ? "View Booking" : "Try Again"}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6 text-center max-w-2xl mx-auto border border-gray-200"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6 text-md">
              Your {getVehicleTypeName(vehicleData.type).toLowerCase()} has been successfully booked.
            </p>
            
            <div className="bg-gray-50 p-5 rounded-lg mb-6 text-left border border-gray-200">
              <h3 className="font-semibold text-md mb-3 pb-2 border-b border-gray-200 text-gray-800">
                Booking Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-600">Booking ID:</div>
                <div className="font-medium text-gray-800">
                  #{Math.floor(100000 + Math.random() * 900000)}
                </div>
                
                {paymentMethod === "upi" && transactionId && (
                  <>
                    <div className="text-gray-600">Transaction ID:</div>
                    <div className="font-medium text-gray-800 font-mono text-xs">
                      {transactionId}
                    </div>
                  </>
                )}
                
                <div className="text-gray-600">Vehicle:</div>
                <div className="font-medium text-gray-800">
                  {getVehicleTypeName(vehicleData.type)} ({vehicleData.vehicleNumber})
                </div>
                
                <div className="text-gray-600">Driver:</div>
                <div className="font-medium text-gray-800">{vehicleData.driver}</div>
                
                <div className="text-gray-600">Route:</div>
                <div className="font-medium text-gray-800">
                  {fromCity} → {toCity}
                </div>
                
                <div className="text-gray-600">Date:</div>
                <div className="font-medium text-gray-800">
                  {formatDate(departureDate)}
                </div>
                
                {vehicleData.type.toLowerCase() === 'bus' && vehicleData.selectedSeats && (
                  <>
                    <div className="text-gray-600">Seats:</div>
                    <div className="font-medium text-gray-800">
                      {vehicleData.selectedSeats.map(seat => seat.number).join(', ')}
                    </div>
                  </>
                )}
                
                <div className="text-gray-600">Total Fare:</div>
                <div className="font-semibold text-blue-600">{getFareDisplay()}</div>
                
                <div className="text-gray-600">Payment Method:</div>
                <div className="font-medium text-gray-800">
                  {paymentMethod === "upi" ? "UPI Payment" : "Cash Payment"}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-lg shadow-xs transition-colors duration-200 text-sm"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate('/user-bookings')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition duration-200 text-sm"
              >
                View My Bookings
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TicketBookingPage;
