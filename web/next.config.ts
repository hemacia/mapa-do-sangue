import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // O repositório tem outro package-lock na raiz (site antigo em Vue).
  turbopack: { root: path.join(__dirname) },
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
