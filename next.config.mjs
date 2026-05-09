/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mammoth", "pdf-lib", "canvas", "pdfjs-dist"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdfjs-dist needs canvas as optional dep
      config.externals = [...(config.externals || []), "canvas"];
    }
    return config;
  },
};

export default nextConfig;
