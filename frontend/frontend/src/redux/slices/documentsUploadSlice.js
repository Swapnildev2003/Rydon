// redux/slices/documentsUploadSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const submitDocuments = createAsyncThunk(
  'documents/submit',
  async (formData, { rejectWithValue }) => {
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const res = await axios.post('http://localhost:8000/api/documents/create/', formData, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const documentsUploadSlice = createSlice({
  name: 'documents',
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetDocumentsState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(submitDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetDocumentsState } = documentsUploadSlice.actions;
export default documentsUploadSlice.reducer;
