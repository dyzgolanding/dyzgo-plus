import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Cubre cualquier proyecto de Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    // Lo dejamos en false porque ya hemos corregido los errores de tipo en los pasos anteriores.
    // Si tienes prisa y queda algún error rebelde, cámbialo a true temporalmente.
    ignoreBuildErrors: false, 
  },
  eslint: {
    // Esto es útil para que el build no falle por reglas de estilo o warnings menores
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;