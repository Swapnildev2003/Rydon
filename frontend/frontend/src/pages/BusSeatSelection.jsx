import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBus, 
  FaChair, 
  FaCheckCircle, 
  FaRupeeSign,
  FaSnowflake,
  FaWifi,
  FaUsers,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaUser,
  FaCouch,
  FaBed,
  FaRegClock,
  FaDoorOpen,
  FaDoorClosed,
  FaWheelchair
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const BusSeatSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedVehicle, fromCity, toCity, departureDate } = location.state || {};

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Seat types with enhanced data
  const getSeatTypes = () => {
    const busType = selectedVehicle?.busType || 'Non-AC Seater';
    
    if (busType.includes('AC')) {
      return [
        { 
          type: 'AC Sleeper', 
          price: 800, 
          color: 'bg-blue-600',
          icon: <FaBed className="mr-1" />,
          features: ['Fully reclining', 'Pillow & blanket', 'Privacy curtain'],
          class: 'premium'
        },
        { 
          type: 'AC Semi-Sleeper', 
          price: 600, 
          color: 'bg-indigo-600',
          icon: <FaCouch className="mr-1" />,
          features: ['Partially reclining', 'Extra legroom'],
          class: 'comfort'
        },
        { 
          type: 'AC Seater', 
          price: 500, 
          color: 'bg-green-600',
          icon: <FaChair className="mr-1" />,
          features: ['Standard seat', 'AC comfort'],
          class: 'standard'
        },
      ];
    } else {
      return [
        { 
          type: 'Non-AC Sleeper', 
          price: 500, 
          color: 'bg-blue-600',
          icon: <FaBed className="mr-1" />,
          features: ['Basic sleeper', 'No AC'],
          class: 'standard'
        },
        { 
          type: 'Non-AC Semi-Sleeper', 
          price: 400, 
          color: 'bg-indigo-600',
          icon: <FaCouch className="mr-1" />,
          features: ['Partially reclining'],
          class: 'basic'
        },
        { 
          type: 'Non-AC Seater', 
          price: 300, 
          color: 'bg-green-600',
          icon: <FaChair className="mr-1" />,
          features: ['Standard seat'],
          class: 'basic'
        },
      ];
    }
  };

  const seatTypes = getSeatTypes();

  // Generate seat layout with all seats available by default
  const generateSeatLayout = () => {
    const seatingCapacity = selectedVehicle?.seatingCapacity || 40;
    const rows = Math.ceil(seatingCapacity / 4);
    const seatsPerRow = 4;
    const layout = [];
    
    // Create some random booked seats (10-20% of capacity)
    const bookedSeatsCount = Math.floor(seatingCapacity * (0.1 + Math.random() * 0.1));
    const bookedSeats = new Set();
    
    while (bookedSeats.size < bookedSeatsCount) {
      bookedSeats.add(Math.floor(Math.random() * seatingCapacity) + 1);
    }
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatNumber = (row - 1) * seatsPerRow + seat;
        if (seatNumber > seatingCapacity) break;
        
        const randomType = seatTypes[Math.floor(Math.random() * seatTypes.length)];
        rowSeats.push({
          number: seatNumber,
          type: randomType.type,
          price: randomType.price,
          color: randomType.color,
          available: !bookedSeats.has(seatNumber),
          selected: false,
          features: randomType.features,
          class: randomType.class
        });
      }
      if (rowSeats.length > 0) {
        layout.push(rowSeats);
      }
    }
    return layout;
  };

  const [seatLayout, setSeatLayout] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableSeatsCount, setAvailableSeatsCount] = useState(0);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    if (!selectedVehicle) {
      navigate('/bus-results');
      return;
    }
    
    const seatingCapacity = selectedVehicle.seatingCapacity || 40;
    setAvailableSeatsCount(seatingCapacity);
    setSeatLayout(generateSeatLayout());
  }, [selectedVehicle]);

  const toggleSeatSelection = (rowIndex, seatIndex) => {
    const updatedLayout = [...seatLayout];
    const seat = updatedLayout[rowIndex][seatIndex];
    
    if (!seat.available) return;
    
    seat.selected = !seat.selected;
    
    const newSelectedSeats = [];
    let newTotalPrice = 0;
    
    updatedLayout.forEach(row => {
      row.forEach(s => {
        if (s.selected) {
          newSelectedSeats.push(s);
          newTotalPrice += s.price;
        }
      });
    });
    
    setSeatLayout(updatedLayout);
    setSelectedSeats(newSelectedSeats);
    setTotalPrice(newTotalPrice);
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    navigate('/book', {
      state: {
        selectedVehicle: {
          ...selectedVehicle,
          selectedSeats,
          totalPrice: `₹${totalPrice}`,
          fare: `₹${totalPrice}`,
          seatsBooked: selectedSeats.length
        },
        fromCity,
        toCity,
        departureDate
      }
    });
  };

  if (!selectedVehicle) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-40 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md border border-gray-200"
        >
          <h2 className="text-2xl font-bold mb-4 text-orange-600">No Bus Selected</h2>
          <p className="mb-6 text-gray-600">
            Please go back and select a bus to continue with seat selection.
          </p>
          <button
            onClick={() => navigate('/bus-booking')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md"
          >
            Back to Bus Selection
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-40 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 mr-3 transition-colors duration-200 flex items-center"
            >
              <FaArrowLeft className="text-gray-600 text-lg mr-2" />
              <span className="text-sm font-medium text-gray-700">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 font-sans">Select Your Seats</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm bg-blue-50 px-4 py-2 rounded-full">
              <FaCalendarAlt className="text-blue-500 mr-2" />
              <span className="font-medium text-gray-700">{departureDate}</span>
            </div>
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Bus Info Card */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200"
          >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center mr-4 shadow-sm">
                  <FaBus className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 font-sans">{selectedVehicle.busType} - {selectedVehicle.vehicleNumber}</h2>
                  <div className="flex flex-wrap items-center mt-1 space-x-4">
                    <span className="flex items-center text-sm text-gray-600">
                      <FaUser className="mr-1.5 text-gray-500" /> {selectedVehicle.driver}
                    </span>
                    <span className="flex items-center text-sm text-gray-600">
                      <FaStar className="text-yellow-400 mr-1.5" /> {selectedVehicle.rating} ★
                    </span>
                    <span className="flex items-center text-sm text-gray-600">
                      <FaRegClock className="mr-1.5 text-gray-500" /> {selectedVehicle.eta || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full md:w-auto">
                <div className="flex items-center text-sm text-gray-700 mb-1">
                  <FaMapMarkerAlt className="text-blue-500 mr-2" />
                  <span className="font-medium">{fromCity} → {toCity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Available: <span className="text-green-600 font-bold">{availableSeatsCount - selectedSeats.length}</span>/{availableSeatsCount}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              {selectedVehicle.acStatus && (
                <span className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                  <FaSnowflake className="mr-1.5" /> Air Conditioned
                </span>
              )}
              {selectedVehicle.wifiConnected && (
                <span className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-100">
                  <FaWifi className="mr-1.5" /> Free WiFi
                </span>
              )}
              <span className="flex items-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-100">
                <FaUsers className="mr-1.5" /> {selectedVehicle.seatingCapacity} Seats
              </span>
              {selectedVehicle.wheelchairAccessible && (
                <span className="flex items-center bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium border border-orange-100">
                  <FaWheelchair className="mr-1.5" /> Wheelchair Access
                </span>
              )}
            </motion.div>
          </motion.div>

          {/* Seat Selection Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200"
          >
            <motion.div variants={itemVariants} className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center font-sans">
                <FaChair className="text-blue-500 mr-3" />
                Seat Selection
              </h2>
              <button 
                onClick={() => setShowLegend(!showLegend)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showLegend ? 'Hide Legend' : 'Show Legend'}
              </button>
            </motion.div>

            {/* Seat Legend */}
            {showLegend && (
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                {seatTypes.map((type, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-5 h-5 rounded-full ${type.color} mr-3 mt-1 flex-shrink-0`}></div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800">{type.type}</span>
                        <span className="ml-2 text-gray-600 flex items-center text-sm">
                          <FaRupeeSign className="mr-1" />{type.price}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {type.features.join(' • ')}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Booked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
              </motion.div>
            )}

            {/* Bus Layout */}
            <motion.div variants={itemVariants} className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Bus driver area */}
                <div className="text-center mb-6 relative">
                  <div className="w-24 h-12 bg-gradient-to-r from-gray-300 to-gray-400 rounded-t-xl mx-auto shadow-inner flex items-center justify-center">
                    <FaUser className="text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">Driver Cabin</div>
                  <div className="absolute top-4 left-4 text-gray-400">
                    <FaDoorClosed />
                  </div>
                  <div className="absolute top-4 right-4 text-gray-400">
                    <FaDoorClosed />
                  </div>
                </div>
                
                {/* Seat map */}
                <div className="relative">
                  {hoveredSeat && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-3 z-10 min-w-[220px] border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800">Seat {hoveredSeat.number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${hoveredSeat.color} text-white capitalize`}>
                          {hoveredSeat.class}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700 mb-2">
                        <span className={`w-3 h-3 rounded-full ${hoveredSeat.color} mr-2`}></span>
                        <span>{hoveredSeat.type}</span>
                      </div>
                      <div className="flex items-center text-sm font-medium text-gray-900 mb-3">
                        <FaRupeeSign className="mr-1 text-gray-600" />
                        <span>{hoveredSeat.price}</span>
                      </div>
                      {hoveredSeat.features && (
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">FEATURES:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {hoveredSeat.features.map((feature, i) => (
                              <li key={i} className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  <div className="mb-4 bg-gray-100 p-3 rounded-lg">
                    <div className="text-center text-sm font-medium text-gray-600 mb-2">Lower Deck</div>
                    {seatLayout.slice(0, Math.ceil(seatLayout.length / 2)).map((row, rowIndex) => (
                      <div key={`lower-${rowIndex}`} className="flex justify-center mb-3">
                        {row.map((seat, seatIndex) => (
                          <motion.button
                            key={seat.number}
                            onClick={() => toggleSeatSelection(rowIndex, seatIndex)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            disabled={!seat.available}
                            whileHover={{ scale: seat.available ? 1.1 : 1 }}
                            whileTap={{ scale: seat.available ? 0.95 : 1 }}
                            className={`w-12 h-12 m-1 rounded-lg flex flex-col items-center justify-center text-sm font-medium relative transition-all duration-200 border
                              ${seat.selected 
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md border-orange-700' 
                                : seat.available 
                                  ? `${seat.color} text-white hover:shadow-md border-transparent` 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'}
                            `}
                          >
                            {seat.number}
                            {seat.available && !seat.selected && (
                              <span className="text-xs mt-1 flex items-center">
                                <FaRupeeSign className="mr-0.5" />{seat.price}
                              </span>
                            )}
                            {!seat.available && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-px bg-gray-500 transform rotate-45"></div>
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="text-center text-sm font-medium text-gray-600 mb-2">Upper Deck</div>
                    {seatLayout.slice(Math.ceil(seatLayout.length / 2)).map((row, rowIndex) => (
                      <div key={`upper-${rowIndex}`} className="flex justify-center mb-3">
                        {row.map((seat, seatIndex) => (
                          <motion.button
                            key={seat.number}
                            onClick={() => toggleSeatSelection(rowIndex + Math.ceil(seatLayout.length / 2), seatIndex)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            disabled={!seat.available}
                            whileHover={{ scale: seat.available ? 1.1 : 1 }}
                            whileTap={{ scale: seat.available ? 0.95 : 1 }}
                            className={`w-12 h-12 m-1 rounded-lg flex flex-col items-center justify-center text-sm font-medium relative transition-all duration-200 border
                              ${seat.selected 
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md border-orange-700' 
                                : seat.available 
                                  ? `${seat.color} text-white hover:shadow-md border-transparent` 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'}
                            `}
                          >
                            {seat.number}
                            {seat.available && !seat.selected && (
                              <span className="text-xs mt-1 flex items-center">
                                <FaRupeeSign className="mr-0.5" />{seat.price}
                              </span>
                            )}
                            {!seat.available && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-px bg-gray-500 transform rotate-45"></div>
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bus exit area */}
                <div className="text-center mt-6 relative">
                  <div className="w-24 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-b-xl mx-auto shadow-inner flex items-center justify-center text-white">
                    <FaDoorOpen />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">Exit</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Selected Seats Summary */}
          {selectedSeats.length > 0 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 font-sans">Your Selection</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSeats.map((seat, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ y: -3 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${seat.color} mr-3`}></div>
                        <span className="font-bold text-gray-800">Seat {seat.number}</span>
                      </div>
                      <span className="font-bold text-gray-800 flex items-center">
                        <FaRupeeSign className="mr-1 text-gray-600" />{seat.price}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2 capitalize">{seat.class} Class</div>
                    {seat.features && (
                      <ul className="text-xs text-gray-500 space-y-1">
                        {seat.features.map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg text-gray-800">Total ({selectedSeats.length} seats):</span>
                  <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
                </div>
                <span className="text-2xl font-bold text-blue-600 flex items-center">
                  <FaRupeeSign className="mr-1 mt-1" />{totalPrice}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Proceed Button */}
      <div className="p-4 border-t bg-white shadow-sm sticky bottom-0">
        <div className="max-w-7xl mx-auto">
          <motion.button
            onClick={handleProceedToPayment}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow transition-all transform flex items-center justify-center
              ${selectedSeats.length > 0 ? 'opacity-100' : 'opacity-90'}
            `}
          >
            <FaCheckCircle className="mr-3 text-xl" />
            <span className="text-lg">
              {selectedSeats.length > 0 ? `Proceed to Pay ₹${totalPrice}` : 'Select Seats to Continue'}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default BusSeatSelectionPage;
