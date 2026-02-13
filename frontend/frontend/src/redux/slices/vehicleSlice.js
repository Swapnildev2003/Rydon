// src/redux/slices/vehicleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper functions to fetch related data
const fetchDriverDetails = async (driverId) => {
  if (!driverId) return null;
  try {
    const response = await axios.get(`http://localhost:8000/api/driver-details/${driverId}/`);
    return response.data.driver;
  } catch (error) {
    console.error('Error fetching driver details:', error);
    return null;
  }
};

const fetchConductorDetails = async (conductorId) => {
  if (!conductorId) return null;
  try {
    const response = await axios.get(`http://localhost:8000/api/conductor-details/${conductorId}/`);
    return response.data.conductor;
  } catch (error) {
    console.error('Error fetching conductor details:', error);
    return null;
  }
};

export const fetchVehicles = createAsyncThunk(
  'vehicle/fetchVehicles',
  async (type, { rejectWithValue }) => {
    try {
      const url = `http://localhost:8000/api/${type}-details/`;
      const response = await axios.get(url);

      // Enhance vehicle data with related details
      const enhancedData = await Promise.all(
        response.data.map(async (vehicle) => {
          const enhancedVehicle = { ...vehicle };

          // Add driver details
          if (vehicle.driver) {
            const driver = await fetchDriverDetails(vehicle.driver);
            enhancedVehicle.driver_name = driver?.name || 'N/A';
            enhancedVehicle.driver_license = driver?.license_number || 'N/A';
          } else {
            enhancedVehicle.driver_name = 'No Driver';
            enhancedVehicle.driver_license = 'N/A';
          }

          // Add conductor details for buses
          if (type === 'bus') {
            if (vehicle.conductor) {
              const conductor = await fetchConductorDetails(vehicle.conductor);
              enhancedVehicle.conductor_name = conductor?.name || 'N/A';
            } else {
              enhancedVehicle.conductor_name = 'No Conductor';
            }
          }

          return enhancedVehicle;
        })
      );

      return { type, data: enhancedData };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch vehicles');
    }
  }
);

export const addVehicle = createAsyncThunk(
  'vehicle/addVehicle',
  async ({ type, data }, { rejectWithValue }) => {
    try {
      const url = `http://localhost:8000/api/create-${type}/`;
      const response = await axios.post(url, data);
      return { type, vehicle: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add vehicle');
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicle/updateVehicle',
  async ({ type, id, data }, { rejectWithValue }) => {
    try {
      const url = `http://localhost:8000/api/update-${type}/${id}/`;
      const response = await axios.put(url, data);
      return { type, vehicle: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update vehicle');
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicle/deleteVehicle',
  async ({ type, id }, { rejectWithValue }) => {
    try {
      const url = `http://localhost:8000/api/delete-${type}/${id}/`;
      await axios.delete(url);
      return { type, id };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete vehicle');
    }
  }
);

const initialState = {
  bus: [],
  car: [],
  bike: [],
  selectedVehicle: null,
  activeSection: 'bus',
  status: 'idle',
  error: null
};

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setActiveSection: (state, action) => {
      state.activeSection = action.payload;
    },
    setSelectedVehicle: (state, action) => {
      state.selectedVehicle = action.payload;
    },
    clearSelectedVehicle: (state) => {
      state.selectedVehicle = null;
    },
    resetVehicleStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { type, data } = action.payload;
        state[type] = data;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addVehicle.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { type, vehicle } = action.payload;
        state[type].push(vehicle);
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateVehicle.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { type, vehicle } = action.payload;
        const index = state[type].findIndex(v => v.id === vehicle.id);
        if (index !== -1) {
          state[type][index] = vehicle;
        }
        state.selectedVehicle = null;
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteVehicle.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { type, id } = action.payload;
        state[type] = state[type].filter(vehicle => vehicle.id !== id);
        state.selectedVehicle = null;
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const {
  setActiveSection,
  setSelectedVehicle,
  clearSelectedVehicle,
  resetVehicleStatus,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
