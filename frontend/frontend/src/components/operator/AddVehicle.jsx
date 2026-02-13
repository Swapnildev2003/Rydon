import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { fetchDrivers, fetchConductors } from '../../redux/slices/staffSlice';
import { addVehicle, updateVehicle } from '../../redux/slices/vehicleSlice';

const AddVehicleForm = ({
  onClose,
  mode = 'add',
  vehicleType = 'bus',
  vehicleData = null,
  onSubmitSuccess
}) => {
  const [slideIn, setSlideIn] = useState(false);
  const [type, setType] = useState(vehicleType);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  const { drivers, conductors, status: staffStatus } = useSelector(state => state.staff);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    licensePlate: "",
    registrationNumber: "",
    fuelType: "",
    modelYear: "",
    initialStatus: "Active",
    busType: "",
    seatingCapacity: "",
    hasAC: false,
    hasWifi: false,
    driver: "",
    conductor: "",
    carType: "",
    passengerCapacity: "",
    bikeType: "",
  });

  useEffect(() => {
    setSlideIn(true);

    const initializeForm = async () => {
      setInitializing(true);
      try {
        if (staffStatus === 'idle') {
          dispatch(fetchDrivers());
          dispatch(fetchConductors());
        }

        if (mode === 'edit' && vehicleData) {
          const mappedData = {
            licensePlate: vehicleData.license_plate || "",
            registrationNumber: vehicleData.registration_number || "",
            fuelType: vehicleData.fuel_type || "",
            modelYear: vehicleData.model_year || "",
            initialStatus: vehicleData.initial_status || "Active",
            driver: vehicleData.driver || "",
          };

          if (vehicleType === 'bus') {
            mappedData.busType = vehicleData.bus_type || "";
            mappedData.seatingCapacity = vehicleData.seating_capacity || "";
            mappedData.hasAC = vehicleData.has_ac || false;
            mappedData.hasWifi = vehicleData.has_wifi || false;
            mappedData.conductor = vehicleData.conductor || "";
          } else if (vehicleType === 'car') {
            mappedData.carType = vehicleData.car_type || "";
            mappedData.passengerCapacity = vehicleData.seating_capacity || "";
          } else if (vehicleType === 'bike') {
            mappedData.bikeType = vehicleData.bike_type || "";
          }

          setFormData(mappedData);
        }
      } catch (err) {
        console.error("Error initializing form:", err);
        setError("Failed to initialize form data");
      } finally {
        setInitializing(false);
      }
    };

    initializeForm();
  }, [mode, vehicleData, vehicleType, dispatch, staffStatus]);

  const handleClose = () => {
    setSlideIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData({
      licensePlate: "",
      registrationNumber: "",
      fuelType: "",
      modelYear: "",
      initialStatus: "Active",
      busType: "",
      seatingCapacity: "",
      hasAC: false,
      hasWifi: false,
      driver: "",
      conductor: "",
      carType: "",
      passengerCapacity: "",
      bikeType: "",
    });
  };

  const handleFieldClick = (e) => {
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (initializing) {
      setError("Form is still initializing");
      return;
    }

    if (mode === 'edit' && !vehicleData?.id) {
      setError("Vehicle data missing for update");
      return;
    }

    setLoading(true);

    try {
      const submissionData = {
        license_plate: formData.licensePlate,
        registration_number: formData.registrationNumber,
        vehicle_type: type,
        fuel_type: formData.fuelType,
        model_year: parseInt(formData.modelYear),
        initial_status: formData.initialStatus,
        ...(type === 'bus' && {
          bus_type: formData.busType,
          seating_capacity: parseInt(formData.seatingCapacity),
          has_ac: formData.hasAC,
          has_wifi: formData.hasWifi,
          driver: formData.driver ? parseInt(formData.driver) : null,
          conductor: formData.conductor ? parseInt(formData.conductor) : null,
        }),
        ...(type === 'car' && {
          car_type: formData.carType,
          seating_capacity: parseInt(formData.passengerCapacity),
          driver: formData.driver ? parseInt(formData.driver) : null,
        }),
        ...(type === 'bike' && {
          bike_type: formData.bikeType,
          driver: formData.driver ? parseInt(formData.driver) : null,
        }),
      };

      if (mode === 'add') {
        await dispatch(addVehicle({ type, data: submissionData })).unwrap();
      } else if (mode === 'edit') {
        await dispatch(updateVehicle({
          type,
          id: vehicleData.id,
          data: submissionData
        })).unwrap();
      }

      onSubmitSuccess();
      handleClose();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "Failed to save vehicle. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0  bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className={`
            relative w-screen max-w-2xl h-full
            transform transition ease-in-out duration-300
            ${slideIn ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto vehicle-form-container">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {mode === 'add' ?
                    `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}` :
                    `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="px-8 py-3 bg-red-50 border-b border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-8 py-6 space-y-6">
                {mode === 'add' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {['bus', 'car', 'bike'].map((vehicleType) => (
                        <button
                          key={vehicleType}
                          type="button"
                          onClick={() => handleTypeChange(vehicleType)}
                          className={`py-3 px-4 rounded-md border transition-all ${type === vehicleType
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-300 hover:border-gray-400'}`}
                        >
                          {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      onClick={handleFieldClick}
                      placeholder="e.g. ABC-1234"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading || initializing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      onClick={handleFieldClick}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading || initializing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      onClick={handleFieldClick}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading || initializing}
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="modelYear"
                      value={formData.modelYear}
                      onChange={handleChange}
                      onClick={handleFieldClick}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loading || initializing}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    name="initialStatus"
                    value={formData.initialStatus}
                    onChange={handleChange}
                    onClick={handleFieldClick}
                    className="w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading || initializing}
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {type === 'bus' && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">Bus Specifications</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bus Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="busType"
                          value={formData.busType}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          placeholder="e.g. Coach, Mini Bus"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={loading || initializing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seating Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="seatingCapacity"
                          value={formData.seatingCapacity}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          min="1"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={loading || initializing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Driver
                        </label>
                        <select
                          name="driver"
                          value={formData.driver}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading || initializing || staffStatus === 'loading'}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.license_number})
                            </option>
                          ))}
                        </select>
                        {staffStatus === 'loading' && (
                          <p className="text-sm text-gray-500 mt-1">Loading drivers...</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Conductor
                        </label>
                        <select
                          name="conductor"
                          value={formData.conductor}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading || initializing || staffStatus === 'loading'}
                        >
                          <option value="">Select Conductor</option>
                          {conductors.map(conductor => (
                            <option key={conductor.id} value={conductor.id}>
                              {conductor.name}
                            </option>
                          ))}
                        </select>
                        {staffStatus === 'loading' && (
                          <p className="text-sm text-gray-500 mt-1">Loading conductors...</p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="hasAC"
                          checked={formData.hasAC}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading || initializing}
                        />
                        <span className="ml-2 text-gray-700">Air Conditioning</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="hasWifi"
                          checked={formData.hasWifi}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading || initializing}
                        />
                        <span className="ml-2 text-gray-700">Wi-Fi</span>
                      </label>
                    </div>
                  </div>
                )}

                {type === 'car' && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">Car Specifications</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Car Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="carType"
                          value={formData.carType}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          placeholder="e.g. Sedan, SUV"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={loading || initializing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Passenger Capacity
                        </label>
                        <input
                          type="number"
                          name="passengerCapacity"
                          value={formData.passengerCapacity}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          min="1"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading || initializing}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver
                      </label>
                      <select
                        name="driver"
                        value={formData.driver}
                        onChange={handleChange}
                        onClick={handleFieldClick}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading || initializing || staffStatus === 'loading'}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} ({driver.license_number})
                          </option>
                        ))}
                      </select>
                      {staffStatus === 'loading' && (
                        <p className="text-sm text-gray-500 mt-1">Loading drivers...</p>
                      )}
                    </div>
                  </div>
                )}

                {type === 'bike' && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">Bike Specifications</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bike Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bikeType"
                          value={formData.bikeType}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          placeholder="e.g. Scooter, Motorcycle"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          disabled={loading || initializing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Driver
                        </label>
                        <select
                          name="driver"
                          value={formData.driver}
                          onChange={handleChange}
                          onClick={handleFieldClick}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={loading || initializing || staffStatus === 'loading'}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} ({driver.license_number})
                            </option>
                          ))}
                        </select>
                        {staffStatus === 'loading' && (
                          <p className="text-sm text-gray-500 mt-1">Loading drivers...</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading || initializing}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      mode === 'add' ? "Add Vehicle" : "Update Vehicle"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleForm;
