/** Max bytes for a Firestore string field (~1MB). Keep under limit. */
const MAX_FIRESTORE_BYTES = 900_000;

/**
 * Compress an image file and return it as a base64 data URL.
 * Auto-reduces quality/size to stay under Firestore's 1MB field limit.
 */
export const imageToBase64 = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image file"));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try compressing, reduce quality/size until under limit
      let q = quality;
      let w = width;
      let h = height;
      let dataUrl = canvas.toDataURL("image/jpeg", q);

      while (dataUrl.length > MAX_FIRESTORE_BYTES && q > 0.1) {
        q -= 0.1;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }

      // If still too large, scale down dimensions
      while (dataUrl.length > MAX_FIRESTORE_BYTES && w > 100) {
        w = Math.round(w * 0.7);
        h = Math.round(h * 0.7);
        canvas.width = w;
        canvas.height = h;
        const ctx2 = canvas.getContext("2d");
        if (ctx2) {
          ctx2.drawImage(img, 0, 0, w, h);
          dataUrl = canvas.toDataURL("image/jpeg", Math.max(q, 0.15));
        } else break;
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
};

/**
 * Compress any file (audio/video) to base64, rejecting if over limit.
 */
export const fileToBase64Checked = (file: File, maxBytes = MAX_FIRESTORE_BYTES): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result.length > maxBytes) {
        reject(new Error(`File too large for storage (${(result.length / 1024 / 1024).toFixed(1)}MB). Max ~${(maxBytes / 1024 / 1024).toFixed(1)}MB after encoding.`));
      } else {
        resolve(result);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/** Profile pic: small, good quality */
export const profilePicToBase64 = (file: File): Promise<string> =>
  imageToBase64(file, 300, 300, 0.7);

/** Chat image: medium size */
export const chatImageToBase64 = (file: File): Promise<string> =>
  imageToBase64(file, 800, 800, 0.6);

/** Status image: medium size */
export const statusImageToBase64 = (file: File): Promise<string> =>
  imageToBase64(file, 800, 800, 0.65);
