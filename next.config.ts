import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 페이지 생성 시 워커 수 제한 (Jest worker crash 방지)
  experimental: {
    workerThreads: false,
    cpus: 4,
  },
};

export default nextConfig;
