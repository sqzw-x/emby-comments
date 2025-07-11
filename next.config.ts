import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  modularizeImports: {
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  // Enable standalone output for Docker
  output: "standalone",
};

export default nextConfig;
