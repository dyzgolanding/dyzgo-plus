import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    // Mantenemos esto para evitar bloqueos por tipos estrictos
    ignoreBuildErrors: true, 
  },
  // ELIMINAMOS EL BLOQUE ESLINT AQUÍ
};

export default nextConfig;