// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import personalDetailsReducer from './slices/personalDetailsSlice';
import bankDetailsReducer from './slices/bankDetailsSlice';
import gstDetailsReducer from './slices/gstDetailsSlice';
import documentsUploadReducer from './slices/documentsUploadSlice';
import vehicleReducer from "./slices/vehicleSlice"
import staffReducer from "./slices/staffSlice"
import routeReducer from "./slices/routeSlice"
const store = configureStore({
  reducer: {
    auth: authReducer,
    personalDetails: personalDetailsReducer,
    bankDetails: bankDetailsReducer,
    gstDetails: gstDetailsReducer,
    documents: documentsUploadReducer,
    vehicle: vehicleReducer,
    route: routeReducer,
    staff: staffReducer,
  },
});

export default store;
