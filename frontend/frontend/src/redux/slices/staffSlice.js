// src/features/staff/staffSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDrivers = createAsyncThunk(
  'staff/fetchDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:8000/api/driver-details/');
      return response.data.drivers;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchConductors = createAsyncThunk(
  'staff/fetchConductors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:8000/api/conductor-details/');
      return response.data.conductors;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  drivers: [],
  conductors: [],
  status: 'idle',
  error: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    resetStaffStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Drivers
      .addCase(fetchDrivers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.drivers = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch drivers';
      })

      // Fetch Conductors
      .addCase(fetchConductors.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConductors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conductors = action.payload;
      })
      .addCase(fetchConductors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch conductors';
      });
  },
});

export const { resetStaffStatus } = staffSlice.actions;

export default staffSlice.reducer;
