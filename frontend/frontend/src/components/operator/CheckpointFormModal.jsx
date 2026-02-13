// src/components/CheckpointFormModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { FiX, FiMapPin } from 'react-icons/fi';

const CheckpointFormModal = ({
  mode = 'create',
  checkpoint = null,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState({
    address: '',
    lat: '',
    lng: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (mode === 'edit' && checkpoint) {
      setFormData({
        address: checkpoint.address || '',
        lat: checkpoint.lat || '',
        lng: checkpoint.lng || ''
      });
    }
  }, [mode, checkpoint]);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        setFormData({
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
        // Clear any previous errors
        setErrors({});
      } else {
        setErrors({ address: 'Please select a valid address from the suggestions' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    const newErrors = {};
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.lat || !formData.lng) newErrors.location = 'Please select a valid address to get coordinates';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting checkpoint:', error);
      setErrors({ submit: error.message || 'Failed to submit checkpoint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {mode === 'create' ? 'Add New Checkpoint' : 'Edit Checkpoint'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <Autocomplete
              onLoad={(autocomplete) => autocompleteRef.current = autocomplete}
              onPlaceChanged={handlePlaceChanged}
              fields={['formatted_address', 'geometry.location']}
              options={{
                types: ['address'],
                componentRestrictions: { } // Optional: restrict to specific country
              }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={`w-full pl-10 p-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Search for an address"
                  required
                />
              </div>
            </Autocomplete>
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                value={formData.lat}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Will be auto-filled"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                value={formData.lng}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                placeholder="Will be auto-filled"
                readOnly
              />
            </div>
          </div>
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          {errors.submit && <p className="text-red-500 text-xs mt-1">{errors.submit}</p>}

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              disabled={loading || !formData.address || !formData.lat || !formData.lng}
            >
              {loading ? 'Processing...' : mode === 'create' ? 'Create Checkpoint' : 'Update Checkpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckpointFormModal;
