import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitBankDetails, fetchBankDetails } from "../redux/slices/bankDetailsSlice";
import FormWrapper from "./FormWrapper";

export default function BankDetailsForm({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error, success, data } = useSelector((state) => state.bankDetails);

  const [form, setForm] = useState({
    bank_name: "",
    branch_name: "",
    account_number: "",
    ifsc_code: "",
  });

  // Fetch existing data on component mount
  useEffect(() => {
    dispatch(fetchBankDetails());
  }, [dispatch]);

  // Autofill form when data is fetched
  useEffect(() => {
    if (data) {
      setForm({
        bank_name: data.bank_name || "",
        branch_name: data.branch_name || "",
        account_number: data.account_number || "",
        ifsc_code: data.ifsc_code || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    dispatch(submitBankDetails(form));
  };

  // ✅ Notify parent when submission is successful
  useEffect(() => {
    if (success && typeof onSuccess === "function") {
      onSuccess(); // let parent know it's safe to unlock next step
    }
  }, [success, onSuccess]);

  return (
    <FormWrapper title="Bank Details">
      <div>
        <label className="block mb-1 font-medium">Bank Name</label>
        <input
          name="bank_name"
          value={form.bank_name}
          onChange={handleChange}
          type="text"
          placeholder="e.g., HDFC Bank"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Branch Name</label>
        <input
          name="branch_name"
          value={form.branch_name}
          onChange={handleChange}
          type="text"
          placeholder="e.g., Gomti Nagar"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Account Number</label>
        <input
          name="account_number"
          value={form.account_number}
          onChange={handleChange}
          type="text"
          placeholder="e.g., 1234567890"
          className="w-full border px-4 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">IFSC Code</label>
        <input
          name="ifsc_code"
          value={form.ifsc_code}
          onChange={handleChange}
          type="text"
          placeholder="e.g., HDFC0001234"
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
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </FormWrapper>
  );
}
