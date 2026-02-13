import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchVehicles, 
  setActiveSection, 
  setSelectedVehicle, 
  clearSelectedVehicle,
  deleteVehicle,
  resetVehicleStatus
} from '../../redux/slices/vehicleSlice';
import AddVehicleForm from '../operator/AddVehicle';
import { PulseLoader } from 'react-spinners';
import ReactPaginate from 'react-paginate';

const VehicleManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    license_plate: '',
    registration_number: '',
    driver_name: '',
    status: '',
    fuel_type: '',
    // Bus specific
    bus_type: '',
    has_ac: '',
    has_wifi: '',
    // Car specific
    car_type: '',
    // Bike specific
    bike_type: ''
  });
  
  const itemsPerPage = 10;
  const dispatch = useDispatch();
  
  const {
    bus: busData,
    car: carData,
    bike: bikeData,
    selectedVehicle,
    activeSection,
    status: vehicleStatus,
    error: vehicleError
  } = useSelector(state => state.vehicle);
  
  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isFormClick = event.target.closest('.vehicle-form-container');
      const isActionButton = event.target.closest('.action-button');
      
      if (tableRef.current && 
          !tableRef.current.contains(event.target) && 
          !isFormClick && 
          !isActionButton) {
        dispatch(clearSelectedVehicle());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  useEffect(() => {
    if (activeSection) {
      dispatch(fetchVehicles(activeSection));
      setCurrentPage(0);
      // Reset filters when section changes
      setFilters({
        license_plate: '',
        registration_number: '',
        driver_name: '',
        status: '',
        fuel_type: '',
        bus_type: '',
        has_ac: '',
        has_wifi: '',
        car_type: '',
        bike_type: ''
      });
    }
  }, [activeSection, dispatch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(0); // Reset to first page when filters change
  };

  const applyFilters = (data) => {
    if (!data) return [];
    
    return data.filter(vehicle => {
      return (
        (filters.license_plate === '' || 
         vehicle.license_plate?.toLowerCase().includes(filters.license_plate.toLowerCase())) &&
        (filters.registration_number === '' || 
         vehicle.registration_number?.toLowerCase().includes(filters.registration_number.toLowerCase())) &&
        (filters.driver_name === '' || 
         vehicle.driver_name?.toLowerCase().includes(filters.driver_name.toLowerCase())) &&
        (filters.status === '' || 
         vehicle.initial_status?.toLowerCase() === filters.status.toLowerCase()) &&
        (filters.fuel_type === '' || 
         vehicle.fuel_type?.toLowerCase() === filters.fuel_type.toLowerCase()) &&
        // Bus specific filters
        (activeSection !== 'bus' || (
          (filters.bus_type === '' || 
           vehicle.bus_type?.toLowerCase() === filters.bus_type.toLowerCase()) &&
          (filters.has_ac === '' || 
           String(vehicle.has_ac) === filters.has_ac) &&
          (filters.has_wifi === '' || 
           String(vehicle.has_wifi) === filters.has_wifi)
        )) &&
        // Car specific filters
        (activeSection !== 'car' || 
         (filters.car_type === '' || 
          vehicle.car_type?.toLowerCase() === filters.car_type.toLowerCase())) &&
        // Bike specific filters
        (activeSection !== 'bike' || 
         (filters.bike_type === '' || 
          vehicle.bike_type?.toLowerCase() === filters.bike_type.toLowerCase()))
      );
    });
  };

  const handleRowClick = (vehicle) => {
    if (selectedVehicle?.id === vehicle.id) {
      dispatch(clearSelectedVehicle());
    } else {
      dispatch(setSelectedVehicle(vehicle));
    }
  };

  const handleDelete = () => {
    if (!selectedVehicle) return;
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      dispatch(deleteVehicle({ type: activeSection, id: selectedVehicle.id }));
    }
  };

  const handleUpdate = () => {
    if (!selectedVehicle) return;
    
    if (selectedVehicle.license_plate && selectedVehicle.registration_number) {
      setFormMode('edit');
      setShowForm(true);
    } else {
      dispatch(resetVehicleStatus());
    }
  };

  const handleAddVehicle = () => {
    setFormMode('add');
    dispatch(clearSelectedVehicle());
    setShowForm(true);
  };

  const handleFormSubmitSuccess = () => {
    setShowForm(false);
    dispatch(fetchVehicles(activeSection));
  };

  const handleSectionChange = (section) => {
    dispatch(setActiveSection(section));
    dispatch(clearSelectedVehicle());
    setCurrentPage(0);
  };

  const paginateData = (data) => {
    if (!data) return [];
    const startIndex = currentPage * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const pageCount = (data) => {
    if (!data) return 0;
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const renderFilterInputs = () => {
    const commonFilters = (
      <>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
          <input
            type="text"
            name="license_plate"
            value={filters.license_plate}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by license plate"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
          <input
            type="text"
            name="registration_number"
            value={filters.registration_number}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by registration"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
          <input
            type="text"
            name="driver_name"
            value={filters.driver_name}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by driver name"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
        
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
          <select
            name="fuel_type"
            value={filters.fuel_type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Fuel Types</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </>
    );

    let specificFilters = null;
    
    if (activeSection === 'bus') {
      specificFilters = (
        <>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
            <select
              name="bus_type"
              value={filters.bus_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Bus Types</option>
              <option value="standard">Standard</option>
              <option value="articulated">Articulated</option>
              <option value="double_decker">Double Decker</option>
              <option value="minibus">Minibus</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">AC</label>
            <select
              name="has_ac"
              value={filters.has_ac}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">WiFi</label>
            <select
              name="has_wifi"
              value={filters.has_wifi}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </>
      );
    } else if (activeSection === 'car') {
      specificFilters = (
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Car Type</label>
          <select
            name="car_type"
            value={filters.car_type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Car Types</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="coupe">Coupe</option>
            <option value="convertible">Convertible</option>
          </select>
        </div>
      );
    } else if (activeSection === 'bike') {
      specificFilters = (
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bike Type</label>
          <select
            name="bike_type"
            value={filters.bike_type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Bike Types</option>
            <option value="scooter">Scooter</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="electric_bike">Electric Bike</option>
          </select>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {commonFilters}
          {specificFilters}
        </div>
      </div>
    );
  };

  const renderVehicleList = (data, type) => {
    const filteredData = applyFilters(data);
    
    if (vehicleStatus === 'loading') return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" size={15} margin={5} />
      </div>
    );
    
    if (vehicleError) return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{vehicleError}</p>
          </div>
        </div>
      </div>
    );
    
    if (!data || data.length === 0) return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">No {type} data available.</p>
          </div>
        </div>
      </div>
    );

    const commonColumns = [
      { header: 'License Plate', accessor: 'license_plate' },
      { header: 'Registration', accessor: 'registration_number' },
      { header: 'Driver', accessor: 'driver_name' },
      { header: 'Driver License', accessor: 'driver_license' },
      { header: 'Fuel Type', accessor: 'fuel_type' },
      { header: 'Model Year', accessor: 'model_year' },
      { header: 'Status', accessor: 'initial_status' }
    ];

    let specificColumns = [];
    if (type === 'bus') {
      specificColumns = [
        { header: 'Bus Type', accessor: 'bus_type' },
        { header: 'Seats', accessor: 'seating_capacity' },
        { header: 'AC', accessor: 'has_ac', format: (value) => value ? 'Yes' : 'No' },
        { header: 'WiFi', accessor: 'has_wifi', format: (value) => value ? 'Yes' : 'No' },
        { header: 'Conductor', accessor: 'conductor_name' }
      ];
    } else if (type === 'car') {
      specificColumns = [
        { header: 'Car Type', accessor: 'car_type' },
        { header: 'Seats', accessor: 'seating_capacity' }
      ];
    } else if (type === 'bike') {
      specificColumns = [
        { header: 'Bike Type', accessor: 'bike_type' }
      ];
    }

    const allColumns = [...commonColumns, ...specificColumns];
    const paginatedData = paginateData(filteredData);

    return (
      <div className="space-y-4" ref={tableRef}>
        {selectedVehicle && (
          <div className="flex space-x-4">
            <button
              onClick={handleUpdate}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 action-button transition-colors"
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 action-button transition-colors"
            >
              Delete
            </button>
          </div>
        )}

        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <div className="mb-4 text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} {type}s
            {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {allColumns.map((column, index) => (
                  <th 
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((vehicle, rowIndex) => (
                <tr 
                  key={rowIndex}
                  onClick={() => handleRowClick(vehicle)}
                  className={`cursor-pointer ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  {allColumns.map((column, colIndex) => {
                    const value = vehicle[column.accessor];
                    const displayValue = column.format 
                      ? column.format(value) 
                      : (value === null || value === undefined ? 'N/A' : value);
                    
                    return (
                      <td 
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length > itemsPerPage && (
            <div className="mt-4 flex justify-center">
              <ReactPaginate
                previousLabel={'Previous'}
                nextLabel={'Next'}
                breakLabel={'...'}
                pageCount={pageCount(filteredData)}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageChange}
                containerClassName={'flex items-center space-x-2'}
                pageClassName={'px-3 py-1 rounded hover:bg-gray-100'}
                pageLinkClassName={'text-sm font-medium text-gray-700'}
                previousClassName={'px-3 py-1 rounded hover:bg-gray-100'}
                nextClassName={'px-3 py-1 rounded hover:bg-gray-100'}
                previousLinkClassName={'text-sm font-medium text-gray-700'}
                nextLinkClassName={'text-sm font-medium text-gray-700'}
                activeClassName={'bg-blue-100 text-blue-600'}
                activeLinkClassName={'font-semibold'}
                breakClassName={'px-3 py-1'}
                disabledClassName={'opacity-50 cursor-not-allowed'}
                forcePage={currentPage}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAddVehicle}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center"
        >
          <span className="mr-1">+</span> Add Vehicle
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleSectionChange('bus')}
          className={`px-4 py-2 font-medium text-sm ${activeSection === 'bus' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
        >
          Buses
        </button>
        <button
          onClick={() => handleSectionChange('car')}
          className={`px-4 py-2 font-medium text-sm ${activeSection === 'car' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
        >
          Cars
        </button>
        <button
          onClick={() => handleSectionChange('bike')}
          className={`px-4 py-2 font-medium text-sm ${activeSection === 'bike' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
        >
          Bikes
        </button>
      </div>

      {renderFilterInputs()}

      <div className="space-y-4">
        {activeSection === 'bus' && renderVehicleList(busData, 'bus')}
        {activeSection === 'car' && renderVehicleList(carData, 'car')}
        {activeSection === 'bike' && renderVehicleList(bikeData, 'bike')}
      </div>

      {showForm && (
        <AddVehicleForm 
          onClose={() => setShowForm(false)}
          mode={formMode}
          vehicleType={activeSection}
          vehicleData={selectedVehicle}
          onSubmitSuccess={handleFormSubmitSuccess}
        />
      )}
    </div>
  );
};

export default VehicleManagement;
