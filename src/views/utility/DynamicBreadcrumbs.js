'use client'

import React, { useEffect, useState } from 'react'
import { Breadcrumbs, Typography } from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePathname } from 'next/navigation'

const DynamicBreadcrumbs = ({
  pageItems,
  sx,
  lastBreadcrumbLabel,
  disableRoot = true,
  hiddenSegments = [],
  nonClickableSegments = []
}) => {
  const pathname = usePathname()
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    // For SSR compatibility, also use window.location as fallback
    if (typeof window !== 'undefined' && !pathname) {
      setCurrentPath(window.location.pathname)
    } else {
      setCurrentPath(pathname)
    }
  }, [pathname])

  // Helper to process URL segments
  const generateBreadcrumbs = () => {
    const asPathWithoutQuery = (currentPath || pathname).split('?')[0]
    const asPathNestedRoutes = asPathWithoutQuery.split('/').filter(v => v.length > 0)

    return asPathNestedRoutes
      .map((subpath, idx) => {
        const href = '/' + asPathNestedRoutes.slice(0, idx + 1).join('/')

        let title = subpath
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize

        if (lastBreadcrumbLabel && idx === asPathNestedRoutes.length - 1) {
          title = lastBreadcrumbLabel
        }

        return { href, title, segment: subpath }
      })
      .filter(item => !hiddenSegments.includes(item.segment))
  }

  const itemsToRender = pageItems || generateBreadcrumbs()

  return (
    <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5, ...sx }}>
      {itemsToRender.map((item, index) => {
        const isLast = index === itemsToRender.length - 1

        // Handle simple string items
        if (typeof item === 'string') {
          return (
            <Typography key={index} color={isLast ? 'text.primary' : 'text.secondary'} sx={{ cursor: 'default' }}>
              {item}
            </Typography>
          )
        }

        // Handle object items
        const { title, href, onClick, active, segment } = item
        const isActive = active || isLast

        // Check if segment is non-clickable
        const isNonClickable = nonClickableSegments.includes(segment)

        // If it's the last item, don't make it a link unless explicitly overridden
        // Also disable root item (first item) if disableRoot is true
        const isRoot = index === 0 && disableRoot

        if (href && !isActive && !isRoot && !isNonClickable) {
          return (
            <Link key={index} href={href} passHref style={{ textDecoration: 'none' }}>
              <Typography
                color='text.secondary'
                sx={{ cursor: 'pointer', transition: 'color 0.2s', '&:hover': { color: 'text.primary' } }}
              >
                {title}
              </Typography>
            </Link>
          )
        }

        return (
          <Typography
            key={index}
            color={isActive ? 'text.primary' : 'text.secondary'}
            onClick={onClick}
            sx={{
              cursor: onClick ? 'pointer' : 'default',
              transition: 'color 0.2s',
              ...(onClick && !isActive && { '&:hover': { color: 'text.primary' } })
            }}
          >
            {title}
          </Typography>
        )
      })}
    </Breadcrumbs>
  )
}

export default DynamicBreadcrumbs
