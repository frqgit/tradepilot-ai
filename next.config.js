/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure stable output for Vercel deployment
  output: 'standalone',
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
    // Configure external packages for serverless
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_APP_NAME: 'TradePilot.AI',
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

module.exports = nextConfig;
