// redux/slices/gstDetailsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitGstDetails = createAsyncThunk(
  'gstDetails/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        'http://localhost:8000/api/gst-details/create/',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


const gstDetailsSlice = createSlice({
  name: 'gstDetails',
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetGstDetailsState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitGstDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitGstDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(submitGstDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetGstDetailsState } = gstDetailsSlice.actions;
export default gstDetailsSlice.reducer;
