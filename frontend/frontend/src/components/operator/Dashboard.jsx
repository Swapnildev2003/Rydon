import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVehicles, setActiveSection } from '../../redux/slices/vehicleSlice';
import { fetchDrivers, fetchConductors } from '../../redux/slices/staffSlice';
import { PulseLoader } from 'react-spinners';
import { FaBus, FaCar, FaMotorcycle, FaUserTie, FaUser } from 'react-icons/fa';

const Dashboard = () => {
 const dispatch = useDispatch();
  const {
    bus: busData,
    car: carData,
    bike: bikeData,
    activeSection,
    status: vehicleStatus,
    error: vehicleError
  } = useSelector(state => state.vehicle);
  
  const {
    drivers,
    conductors,
    status: staffStatus
  } = useSelector(state => state.staff);

  useEffect(() => {
    dispatch(fetchVehicles('bus'));
    dispatch(fetchDrivers());
    dispatch(fetchConductors());
  }, [dispatch]);

  const handleSectionChange = (section) => {
    dispatch(setActiveSection(section));
  };

  const renderVehicleStats = () => {
    const data = activeSection === 'bus' ? busData : 
                activeSection === 'car' ? carData : bikeData;
    
    const activeVehicles = data?.filter(v => v.initial_status === 'active').length || 0;
    const maintenanceVehicles = data?.filter(v => v.initial_status === 'maintenance').length || 0;
    const inactiveVehicles = data?.filter(v => v.initial_status === 'inactive').length || 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Vehicles</h3>
          <p className="text-3xl font-bold text-blue-600">{data?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Active</h3>
          <p className="text-3xl font-bold text-green-600">{activeVehicles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">In Maintenance</h3>
          <p className="text-3xl font-bold text-yellow-600">{maintenanceVehicles}</p>
        </div>
      </div>
    );
  };

  const renderStaffStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaUserTie className="text-blue-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Drivers</h3>
              <p className="text-3xl font-bold text-blue-600">{drivers?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FaUser className="text-green-500 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Conductors</h3>
              <p className="text-3xl font-bold text-green-600">{conductors?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecentVehicles = () => {
    const data = activeSection === 'bus' ? busData : 
                activeSection === 'car' ? carData : bikeData;
    
    if (vehicleStatus === 'loading') return (
      <div className="flex justify-center items-center h-64">
        <PulseLoader color="#3B82F6" size={15} margin={5} />
      </div>
    );
    
    if (vehicleError) return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{vehicleError}</p>
      </div>
    );
    
    if (!data || data.length === 0) return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-blue-700">No vehicles found</p>
      </div>
    );

    const recentVehicles = [...data].slice(0, 5);

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent {activeSection}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {activeSection === 'bus' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentVehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.license_plate || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vehicle.driver_name || 'No Driver'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      vehicle.initial_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : vehicle.initial_status === 'maintenance' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.initial_status || 'N/A'}
                    </span>
                  </td>
                  {activeSection === 'bus' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.conductor_name || 'No Conductor'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6">
      {/* <h1 className="text-2xl font-bold mb-6">Operator Dashboard</h1> */}
      
      {/* Vehicle Type Selector */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleSectionChange('bus')}
          className={`px-4 py-2 font-medium text-sm flex items-center ${activeSection === 'bus' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FaBus className="mr-2" /> Buses
        </button>
        <button
          onClick={() => handleSectionChange('car')}
          className={`px-4 py-2 font-medium text-sm flex items-center ${activeSection === 'car' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FaCar className="mr-2" /> Cars
        </button>
        <button
          onClick={() => handleSectionChange('bike')}
          className={`px-4 py-2 font-medium text-sm flex items-center ${activeSection === 'bike' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FaMotorcycle className="mr-2" /> Bikes
        </button>
      </div>
      
      {/* Vehicle Statistics */}
      {renderVehicleStats()}
      
      {/* Staff Statistics */}
      {renderStaffStats()}
      
      {/* Recent Vehicles Table */}
      {renderRecentVehicles()}
    </div>
  );
};

export default Dashboard;
