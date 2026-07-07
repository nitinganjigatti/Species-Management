/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const pkg = require('./package.json')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features

module.exports = {
  transpilePackages: ['@antzsoft/wso2-auth-web'],
  // Isolated build dir for a throwaway QA server (defaults to .next → no-op in normal use).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Single source of truth for the app version: package.json. The sidebar
  // and the X-Client-Version request header read process.env.NEXT_PUBLIC_APP_VERSION;
  // injecting it here means a `npm version` bump (or a manual edit of
  // package.json) is all that's needed — no more drift between env.* files.
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${pkg.version}`
  },
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

    // Proxy API calls to configured backend in development to avoid CORS
    // if (process.env.NODE_ENV === 'development') {
    //   const backend = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080/').replace(/\/$/, '')
    //   rules.push({
    //     source: '/api/:path*',
    //     destination: `${backend}/api/:path*`
    //   })
    // }

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
