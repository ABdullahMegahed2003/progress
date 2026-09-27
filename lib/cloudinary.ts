export async function uploadImageToCloudinary(file: File | string): Promise<string> {
  let base64Image = "";

  if (typeof file === "string") {
    base64Image = file;
  } else {
    base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (error) {
    console.warn("Cloudinary API upload failed, falling back to base64:", error);
  }

  // Fallback to offline local base64 storage if Cloudinary upload fails or offline
  return base64Image;
}
