import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitGstDetails } from "../redux/slices/gstDetailsSlice";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import FormWrapper from "./FormWrapper";

export default function GSTDetailsForm() {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.gstDetails);

  const [gstNumber, setGstNumber] = useState("");
  const [gstFile, setGstFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");
    setUploadSuccess(false);
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File size exceeds 10MB limit");
        return;
      }
      if (file.type !== "application/pdf") {
        setFileError("Only PDF files are accepted");
        return;
      }
      setGstFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!gstFile || !gstNumber.trim()) {
      setFileError(!gstFile ? "Please select a file" : "Please enter GST number");
      return;
    }

    try {
      setUploadProgress(0);
      setUploadSuccess(false);
      
      const cloudinaryUrl = await uploadToCloudinary(gstFile, (progress) => {
        setUploadProgress(progress);
      });
      
      console.log("Cloudinary URL received:", cloudinaryUrl);
      setUploadSuccess(true);
      
      const payload = {
        gst_number: gstNumber,
        gst_certificate_url: cloudinaryUrl,
      };
      alert("Payload to Django:", payload);
       dispatch(submitGstDetails(payload));
      
    } catch (err) {
      console.error("Upload Error:", err);
      setFileError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadProgress(0);
    }
  };

  return (
    <FormWrapper title="GST Details">
     
        {/* GST Number Input */}
        <div>
          <label className="block mb-1 font-medium">GST Number</label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="e.g., 09ABCDE1234F1Z5"
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block mb-1 font-medium">GST Certificate (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full border px-4 py-2 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            required
          />
          {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
          {uploadSuccess && <p className="text-green-500 text-sm mt-1">File uploaded successfully!</p>}
        </div>

        {/* Progress Bar */}
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-orange-500 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-xs text-gray-500 mt-1">
              {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : "Processing..."}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploadProgress > 0}
          onClick={handleSubmit}
          className={`mt-4 px-6 py-2 text-white rounded-lg transition-colors ${
            loading || uploadProgress > 0
              ? "bg-orange-300 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {loading 
            ? "Submitting..." 
            : uploadProgress > 0 
              ? `Uploading (${uploadProgress}%)` 
              : "Submit"}
        </button>

        {/* Status Messages */}
        {success && (
          <p className="text-green-600 mt-2">Submitted successfully!</p>
        )}
        {error && (
          <p className="text-red-600 mt-2">{error}</p>
        )}
    
    </FormWrapper>
  );
}
