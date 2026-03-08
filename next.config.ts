import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Avoid wrong root inference when multiple lockfiles exist.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
