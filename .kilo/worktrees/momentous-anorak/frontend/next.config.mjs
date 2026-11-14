/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // three.js ecosystem ships untranspiled ESM that breaks under Next's
  // default bundling (ReactCurrentOwner crash in @react-three/fiber).
  transpilePackages: ["@react-three/fiber", "@react-three/drei", "three"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
