import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiHome, 
  FiTruck, 
  FiMap, 
  FiBarChart2, 
  FiSettings,
  FiSearch, 
  FiX, 
  FiMenu,
  FiUser,
  FiLogOut,
  FiNavigation
} from 'react-icons/fi';

const Sidebar = ({ setActiveSection, activeSection, menuItems }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    name: 'Operator Admin',
    role: 'operator'
  });

  // Icon component mapping
  const iconComponents = {
    FiHome: FiHome,
    FiTruck: FiTruck,
    FiMap: FiMap,
    FiNavigation:FiNavigation,
    FiBarChart2: FiBarChart2,
    FiSettings: FiSettings

  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      const filtered = menuItems.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, menuItems]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logging out...');
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="fixed z-30 md:hidden top-4 left-4 p-2 rounded-md bg-gray-800 text-white"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed z-20 w-64 min-h-screen bg-gray-800 text-white flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'left-0' : '-left-64'
        } md:relative md:left-0`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Transport Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Operator Panel</p>
        </div>
        
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const IconComponent = iconComponents[item.icon];
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveSection(item.id);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 flex items-center ${
                      activeSection === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {IconComponent && <IconComponent className="mr-3" />}
                    {item.label}
                  </button>
                </li>
              );
            })}
            {filteredItems.length === 0 && (
              <li className="text-gray-400 text-center py-4">
                No menu items found
              </li>
            )}
          </ul>
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-700 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2">
                <FiUser className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
              title="Logout"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  setActiveSection: PropTypes.func.isRequired,
  activeSection: PropTypes.string.isRequired,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired
    })
  ).isRequired
};

export default Sidebar;
