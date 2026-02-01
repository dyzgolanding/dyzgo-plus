/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Permite imágenes de tus buckets de Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    // Esto permite que el build termine aunque existan errores de tipos menores
    // Úsalo solo si tienes errores de librerías externas que no puedes controlar
    ignoreBuildErrors: false, 
  },
  eslint: {
    // Evita que errores de linting detengan el despliegue
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig