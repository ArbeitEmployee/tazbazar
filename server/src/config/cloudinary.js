const cloudinary = require("cloudinary").v2;
const https = require("https");

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// Auto-sync clock offset with Cloudinary server to prevent "Stale request" errors
// when the local machine's system time differs from Cloudinary server time.
let clockOffsetMs = 0;
let lastOffsetCheck = 0;

const syncClockOffset = () =>
  new Promise((resolve) => {
    // Only re-check once every 30 minutes
    if (lastOffsetCheck && Date.now() - lastOffsetCheck < 30 * 60 * 1000) {
      return resolve(clockOffsetMs);
    }
    const req = https.get("https://api.cloudinary.com", { timeout: 4000 }, (res) => {
      if (res.headers.date) {
        const serverTime = new Date(res.headers.date).getTime();
        clockOffsetMs = serverTime - Date.now();
        lastOffsetCheck = Date.now();
      }
      resolve(clockOffsetMs);
    });
    req.on("error", () => resolve(clockOffsetMs));
    req.on("timeout", () => {
      req.destroy();
      resolve(clockOffsetMs);
    });
  });

const getAdjustedTimestamp = async () => {
  await syncClockOffset().catch(() => 0);
  return Math.floor((Date.now() + clockOffsetMs) / 1000);
};

const uploadImageBuffer = async (buffer, options = {}) => {
  const timestamp = options.timestamp || (await getAdjustedTimestamp());
  const uploadOptions = {
    ...options,
    timestamp,
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
};

const deleteImage = async (publicId, options = {}) => {
  if (!publicId) return null;
  try {
    const timestamp = options.timestamp || (await getAdjustedTimestamp());
    return await cloudinary.uploader.destroy(publicId, {
      ...options,
      timestamp,
    });
  } catch (error) {
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImageBuffer,
  deleteImage,
};
