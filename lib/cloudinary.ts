/**
 * Resizes and compresses an image file using an HTML5 Canvas to max dimension (500px).
 * Prevents localStorage QuotaExceededError and optimizes network uploads.
 */
export async function compressImage(file: File | string, maxDimension = 500, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      if (typeof file === "string") resolve(file);
      else resolve("");
    };

    if (typeof file === "string") {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = String(e.target?.result);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Uploads image to Cloudinary via server API route with fallback to compressed offline base64.
 */
export async function uploadImageToCloudinary(file: File | string): Promise<string> {
  const compressedBase64 = await compressImage(file);
  if (!compressedBase64) return "";

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: compressedBase64 }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (error) {
    console.warn("Cloudinary API upload error, falling back to local storage:", error);
  }

  // Fallback to lightweight compressed base64 string
  return compressedBase64;
}
