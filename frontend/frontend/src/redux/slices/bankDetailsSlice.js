// redux/slices/bankDetailsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitBankDetails = createAsyncThunk(
  'bankDetails/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post('http://localhost:8000/api/bank-details/create/', formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const bankDetailsSlice = createSlice({
  name: 'bankDetails',
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetBankDetailsState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitBankDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitBankDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(submitBankDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBankDetailsState } = bankDetailsSlice.actions;
export default bankDetailsSlice.reducer;
