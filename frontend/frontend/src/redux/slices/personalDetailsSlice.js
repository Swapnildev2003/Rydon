import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitPersonalDetails = createAsyncThunk(
  'personalDetails/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post('http://localhost:8000/api/personal-details/create/', formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const personalDetailsSlice = createSlice({
  name: 'personalDetails',
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetPersonalDetailsState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPersonalDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitPersonalDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(submitPersonalDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPersonalDetailsState } = personalDetailsSlice.actions;
export default personalDetailsSlice.reducer;
