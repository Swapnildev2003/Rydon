import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LoadScript } from "@react-google-maps/api";
import { Provider } from "react-redux";
import store from "./redux/store";

import Navbar from "./components/Navbar";
import Home from "./pages/home";
import ContactForm from "./pages/Contact";
import ServiceProviderForm from "./pages/ServiceProvideAuth";
import UserRegisterForm from "./pages/UserAuth";
import Onboarding from "./pages/Onboarding";
import OperatorDashboard from "./pages/OperatorDashboard";
import BookingForm from "./pages/UserBookingForm";

import TicketBookingPage from "./pages/TicketBooking"; // Add this import
import "./App.css";
// import ResultsPage from "./pages/Result";
import BusSeatSelectionPage from "./pages/BusSeatSelection";
import BusBooking from "./pages/BusBooking";
import VehicleBooking from "./pages/VehicleBooking";
import BookingConfirmation from "./pages/BookingConfirmation";

// Separate component to handle route-based navbar logic
function AppRoutes() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/onboarding" ||
    location.pathname === "/operator" ||
    location.pathname === "/user" ||
    location.pathname === "/operator-dashboard" ||
    location.pathname === "/user-booking" ||
    location.pathname === "/booking-confirmation" ||
    location.pathname === "/book"; // Add the booking route

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<ContactForm />} />
        <Route path="/user" element={<UserRegisterForm />} />
        <Route path="/operator-dashboard" element={<OperatorDashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/operator" element={<ServiceProviderForm />} />
        <Route path="/user-booking" element={<BookingForm />} />
        <Route path="/bus-seats" element={<BusSeatSelectionPage />} />
        <Route path="/bus-results" element={<BusBooking />} />
        <Route path="/vehicle-results" element={<VehicleBooking />} />
        <Route path="/book" element={<TicketBookingPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) loader.style.display = "none";
  }, []);

  return (
    <div className="font-sans">
      <Provider store={store}>
        <GoogleOAuthProvider clientId="683203259162-ppmbf6io7gvae0qpv21m7suduvvuokin.apps.googleusercontent.com">
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["places", "geometry"]}

          >
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </LoadScript>
        </GoogleOAuthProvider>
      </Provider>
    </div>
  );
}

export default App;
