export const uploadToCloudinary = async (file, onProgress) => {
  const cloudName = "dsdqjbubz";
  const uploadPreset = "docsUpload";

  // Validate file
  if (!file) throw new Error("No file provided");
  if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10MB limit");
  if (file.type !== "application/pdf") throw new Error("Only PDF files are accepted");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  console.log("Preparing to upload file:", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  try {
    // Using XMLHttpRequest for better progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log("Cloudinary upload success:", response);
            if (!response.secure_url) {
              throw new Error("No secure_url in response");
            }
            resolve(response.secure_url);
          } catch (parseError) {
            console.error("Response parse error:", parseError);
            reject(new Error("Failed to parse Cloudinary response"));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error("Cloudinary upload error:", errorResponse);
            reject(new Error(errorResponse.error?.message || 'Upload failed'));
          } catch (error) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timed out"));
      });

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);
      xhr.timeout = 30000; // 30 seconds timeout
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Cloudinary upload exception:", error);
    throw error;
  }
};
