import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitPersonalDetails, fetchPersonalDetails } from "../redux/slices/personalDetailsSlice";
import FormWrapper from "./FormWrapper";

export default function PersonalDetailsForm({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error, success, data } = useSelector((state) => state.personalDetails);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
  });

  // Fetch existing data on component mount
  useEffect(() => {
    dispatch(fetchPersonalDetails());
  }, [dispatch]);

  // Autofill form when data is fetched
  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    dispatch(submitPersonalDetails(form));
  };

  // ✅ Trigger onSuccess callback when submission is successful
  useEffect(() => {
    if (success && typeof onSuccess === "function") {
      onSuccess();
    }
  }, [success, onSuccess]);

  return (
    <FormWrapper title="Personal Details">
      <div>
        <label className="block mb-1 font-medium">Full Name</label>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          type="text"
          placeholder="Enter full name"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          placeholder="Enter email"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Phone Number</label>
        <input
          name="phone_number"
          value={form.phone_number}
          onChange={handleChange}
          type="tel"
          placeholder="Enter phone number"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          type="text"
          placeholder="Enter address"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>

      {success && <p className="text-green-600 mt-2">Submitted successfully!</p>}
      {error && <p className="text-red-600 mt-2">{JSON.stringify(error)}</p>}
    </FormWrapper>
  );
}
