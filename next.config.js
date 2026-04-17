/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  // Suppress Emotion SSR warnings for :first-child pseudo-class
  compiler: {
    emotion: true
  },
  // devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dev.antzsystems.com'
      }
    ]
  },
  async rewrites() {
    const rules = [
      {
        source: '/reports/keyinsights',
        destination: '/reports/keyinsights/index.html'
      },
      {
        source: '/reports/keyinsights/',
        destination: '/reports/keyinsights/index.html'
      },
      {
        source: '/reports/users',
        destination: '/reports/users/index.html'
      },
      {
        source: '/reports/users/',
        destination: '/reports/users/index.html'
      },
      {
        source: '/reports/assessment-dashboard',
        destination: '/reports/assessment-dashboard/index.html'
      },
      {
        source: '/reports/assessment-dashboard/',
        destination: '/reports/assessment-dashboard/index.html'
      }
    ]

    // Proxy API calls to local backend in development to avoid CORS
    if (process.env.NODE_ENV === 'development') {
      rules.push({
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*'
      })
    }

    return rules
  },
  turbopack: {
    resolveAlias: {
      apexcharts: './node_modules/apexcharts-clevision',
      'apexcharts/dist/apexcharts.common': './node_modules/apexcharts-clevision/dist/apexcharts.common.js'
    }
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  }
}
