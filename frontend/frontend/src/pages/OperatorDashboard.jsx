// OperatorDashboard.js
import React, { useState } from 'react';
import Sidebar from '../components/operator/Sidebar';
import VehicleManagement from '../components/operator/VehicleManagement';
import Dashboard from '../components/operator/Dashboard';
import RouteManagement from '../components/operator/RouteManagement';
import VehicleTracking from '../components/operator/VehicleTracking'; // Add this import

function OperatorDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'FiHome' },
    { id: 'vehicleManagement', label: 'Vehicle Management', icon: 'FiTruck' },
    { id: 'routeManagement', label: 'Route Management', icon: 'FiMap' },
    { id: 'vehicleTracking', label: 'Vehicle Tracking', icon: 'FiNavigation' }, // Add this menu item
    { id: 'reports', label: 'Reports', icon: 'FiBarChart2' },
    { id: 'settings', label: 'Settings', icon: 'FiSettings' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        setActiveSection={setActiveSection} 
        activeSection={activeSection}
        menuItems={menuItems}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'vehicleManagement' && <VehicleManagement />}
          {activeSection === 'routeManagement' && <RouteManagement />}
          {activeSection === 'vehicleTracking' && <VehicleTracking />} {/* Add this line */}
          {activeSection === 'reports' && <Reports />}
          {activeSection === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default OperatorDashboard;
