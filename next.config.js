/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  webpack: (config, { isServer }) => {
    if (isServer && process.env.NODE_ENV === 'development') {
      console.log('========================================');
      console.log('Environment Variables:');
      console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('========================================');
    }
    return config;
  },
}

module.exports = nextConfig
