import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Bus Routes
export const fetchBusRoutes = createAsyncThunk(
  'route/fetchBusRoutes',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/bus-routes/`);
    return response.data;
  }
);

export const createBusRoute = createAsyncThunk(
  'route/createBusRoute',
  async (routeData) => {
    const response = await axios.post(`${API_BASE_URL}/bus-routes/create/`, routeData);
    return response.data;
  }
);

export const updateBusRoute = createAsyncThunk(
  'route/updateBusRoute',
  async ({ id, data }) => {
    const response = await axios.put(`${API_BASE_URL}/bus-routes/update/${id}/`, data);
    return response.data;
  }
);

export const deleteBusRoute = createAsyncThunk(
  'route/deleteBusRoute',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/bus-routes/delete/${id}/`);
    return id;
  }
);

// Bus Checkpoints
export const fetchBusCheckpoints = createAsyncThunk(
  'route/fetchBusCheckpoints',
  async ({ routeId }) => {
    const response = await axios.get(`${API_BASE_URL}/bus-checkpoints/?route=${routeId}`);
    return { routeId, checkpoints: response.data };
  }
);

export const createBusCheckpoint = createAsyncThunk(
  'route/createBusCheckpoint',
  async (checkpointData) => {
    const response = await axios.post(`${API_BASE_URL}/bus-checkpoints/create/`, checkpointData);
    return response.data;
  }
);

export const updateBusCheckpoint = createAsyncThunk(
  'route/updateBusCheckpoint',
  async ({ id, data }) => {
    const response = await axios.put(`${API_BASE_URL}/bus-checkpoints/update/${id}/`, data);
    return response.data;
  }
);

export const deleteBusCheckpoint = createAsyncThunk(
  'route/deleteBusCheckpoint',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/bus-checkpoints/delete/${id}/`);
    return id;
  }
);

// Car Routes
export const fetchCarRoutes = createAsyncThunk(
  'route/fetchCarRoutes',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/car-routes/`);
    return response.data;
  }
);

export const createCarRoute = createAsyncThunk(
  'route/createCarRoute',
  async (routeData) => {
    const response = await axios.post(`${API_BASE_URL}/car-routes/create/`, routeData);
    return response.data;
  }
);

export const updateCarRoute = createAsyncThunk(
  'route/updateCarRoute',
  async ({ id, data }) => {
    const response = await axios.put(`${API_BASE_URL}/car-routes/update/${id}/`, data);
    return response.data;
  }
);

export const deleteCarRoute = createAsyncThunk(
  'route/deleteCarRoute',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/car-routes/delete/${id}/`);
    return id;
  }
);

// Bike Routes
export const fetchBikeRoutes = createAsyncThunk(
  'route/fetchBikeRoutes',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/bike-routes/`);
    return response.data;
  }
);

export const createBikeRoute = createAsyncThunk(
  'route/createBikeRoute',
  async (routeData) => {
    const response = await axios.post(`${API_BASE_URL}/bike-routes/create/`, routeData);
    return response.data;
  }
);

export const updateBikeRoute = createAsyncThunk(
  'route/updateBikeRoute',
  async ({ id, data }) => {
    const response = await axios.put(`${API_BASE_URL}/bike-routes/update/${id}/`, data);
    return response.data;
  }
);

export const deleteBikeRoute = createAsyncThunk(
  'route/deleteBikeRoute',
  async (id) => {
    await axios.delete(`${API_BASE_URL}/bike-routes/delete/${id}/`);
    return id;
  }
);

const routeSlice = createSlice({
  name: 'route',
  initialState: {
    busRoutes: [],
    carRoutes: [],
    bikeRoutes: [],
    checkpoints: [],
    status: {
      bus: 'idle',
      car: 'idle',
      bike: 'idle',
      checkpoints: 'idle'
    },
    operationStatus: 'idle',
    error: null
  },
  reducers: {
    resetOperationStatus: (state) => {
      state.operationStatus = 'idle';
    },
    clearCheckpoints: (state) => {
      state.checkpoints = [];
    }
  },
  extraReducers: (builder) => {
    // Bus Routes
    builder.addCase(fetchBusRoutes.pending, (state) => {
      state.status.bus = 'loading';
    });
    builder.addCase(fetchBusRoutes.fulfilled, (state, action) => {
      state.status.bus = 'succeeded';
      state.busRoutes = action.payload;
    });
    builder.addCase(fetchBusRoutes.rejected, (state, action) => {
      state.status.bus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(createBusRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(createBusRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.busRoutes.push(action.payload);
    });
    builder.addCase(createBusRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(updateBusRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(updateBusRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      const index = state.busRoutes.findIndex(route => route.id === action.payload.id);
      if (index !== -1) {
        state.busRoutes[index] = action.payload;
      }
    });
    builder.addCase(updateBusRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(deleteBusRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(deleteBusRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.busRoutes = state.busRoutes.filter(route => route.id !== action.payload);
    });
    builder.addCase(deleteBusRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    // Bus Checkpoints
    builder.addCase(fetchBusCheckpoints.pending, (state) => {
      state.status.checkpoints = 'loading';
    });
    builder.addCase(fetchBusCheckpoints.fulfilled, (state, action) => {
      state.status.checkpoints = 'succeeded';
      state.checkpoints = action.payload.checkpoints;
    });
    builder.addCase(fetchBusCheckpoints.rejected, (state, action) => {
      state.status.checkpoints = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(createBusCheckpoint.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(createBusCheckpoint.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.checkpoints.push(action.payload);
    });
    builder.addCase(createBusCheckpoint.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(updateBusCheckpoint.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(updateBusCheckpoint.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      const index = state.checkpoints.findIndex(cp => cp.id === action.payload.id);
      if (index !== -1) {
        state.checkpoints[index] = action.payload;
      }
    });
    builder.addCase(updateBusCheckpoint.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(deleteBusCheckpoint.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(deleteBusCheckpoint.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.checkpoints = state.checkpoints.filter(cp => cp.id !== action.payload);
    });
    builder.addCase(deleteBusCheckpoint.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    // Car Routes (similar pattern as bus routes)
    builder.addCase(fetchCarRoutes.pending, (state) => {
      state.status.car = 'loading';
    });
    builder.addCase(fetchCarRoutes.fulfilled, (state, action) => {
      state.status.car = 'succeeded';
      state.carRoutes = action.payload;
    });
    builder.addCase(fetchCarRoutes.rejected, (state, action) => {
      state.status.car = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(createCarRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(createCarRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.carRoutes.push(action.payload);
    });
    builder.addCase(createCarRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(updateCarRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(updateCarRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      const index = state.carRoutes.findIndex(route => route.id === action.payload.id);
      if (index !== -1) {
        state.carRoutes[index] = action.payload;
      }
    });
    builder.addCase(updateCarRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(deleteCarRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(deleteCarRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.carRoutes = state.carRoutes.filter(route => route.id !== action.payload);
    });
    builder.addCase(deleteCarRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    // Bike Routes (similar pattern as bus routes)
    builder.addCase(fetchBikeRoutes.pending, (state) => {
      state.status.bike = 'loading';
    });
    builder.addCase(fetchBikeRoutes.fulfilled, (state, action) => {
      state.status.bike = 'succeeded';
      state.bikeRoutes = action.payload;
    });
    builder.addCase(fetchBikeRoutes.rejected, (state, action) => {
      state.status.bike = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(createBikeRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(createBikeRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.bikeRoutes.push(action.payload);
    });
    builder.addCase(createBikeRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(updateBikeRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(updateBikeRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      const index = state.bikeRoutes.findIndex(route => route.id === action.payload.id);
      if (index !== -1) {
        state.bikeRoutes[index] = action.payload;
      }
    });
    builder.addCase(updateBikeRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });

    builder.addCase(deleteBikeRoute.pending, (state) => {
      state.operationStatus = 'loading';
    });
    builder.addCase(deleteBikeRoute.fulfilled, (state, action) => {
      state.operationStatus = 'succeeded';
      state.bikeRoutes = state.bikeRoutes.filter(route => route.id !== action.payload);
    });
    builder.addCase(deleteBikeRoute.rejected, (state, action) => {
      state.operationStatus = 'failed';
      state.error = action.error.message;
    });
  }
});

export const { resetOperationStatus, clearCheckpoints } = routeSlice.actions;
export default routeSlice.reducer;
