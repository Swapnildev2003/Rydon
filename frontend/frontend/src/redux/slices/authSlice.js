import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to send OTP
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async ({ phone, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:8000/api/send-otp/', {
        phone,
        role,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk to verify OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:8000/api/verify-otp/', {
        phone,
        otp,
        role,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    phone: '',
    otp: ['', '', '', ''],
    isOtpSent: false,
    isOtpVerified: false,
    loading: false,
    error: null,
    resendCooldown: 30,
    resendActive: false,
    role: '',
  },
  reducers: {
    setPhone: (state, action) => {
      state.phone = action.payload;
    },
    setOtpValue: (state, action) => {
      const { index, value } = action.payload;
      state.otp[index] = value;
    },
    resetOtp: (state) => {
      state.otp = ['', '', '', ''];
    },
    resetAuthState: (state) => {
      state.phone = '';
      state.otp = ['', '', '', ''];
      state.isOtpSent = false;
      state.isOtpVerified = false;
      state.loading = false;
      state.error = null;
      state.resendCooldown = 30;
      state.resendActive = false;
      state.role = '';
    },
    startResendCooldown: (state) => {
      state.resendActive = true;
      state.resendCooldown = 30;
    },
    decrementResendCooldown: (state) => {
      if (state.resendCooldown > 0) {
        state.resendCooldown--;
      } else {
        state.resendActive = false;
      }
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.isOtpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isOtpVerified = true;
        // Simply store the tokens in localStorage
        localStorage.setItem('tokens', JSON.stringify(action.payload.tokens));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPhone,
  setOtpValue,
  resetOtp,
  resetAuthState,
  startResendCooldown,
  decrementResendCooldown,
  setRole,
} = authSlice.actions;

export default authSlice.reducer;
