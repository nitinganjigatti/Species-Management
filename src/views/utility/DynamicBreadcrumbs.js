import React from 'react'
import { Breadcrumbs, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'

const DynamicBreadcrumbs = ({ pageItems, sx, lastBreadcrumbLabel, disableRoot = true }) => {
  const router = useRouter()

  // Helper to process URL segments
  const generateBreadcrumbs = () => {
    const asPathWithoutQuery = router.asPath.split('?')[0]
    const asPathNestedRoutes = asPathWithoutQuery.split('/').filter(v => v.length > 0)

    return asPathNestedRoutes.map((subpath, idx) => {
      const href = '/' + asPathNestedRoutes.slice(0, idx + 1).join('/')

      let title = subpath
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize

      if (lastBreadcrumbLabel && idx === asPathNestedRoutes.length - 1) {
        title = lastBreadcrumbLabel
      }

      return { href, title }
    })
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
        const { title, href, onClick, active } = item
        const isActive = active || isLast

        // If it's the last item, don't make it a link unless explicitly overridden
        // Also disable root item (first item) if disableRoot is true
        const isRoot = index === 0 && disableRoot

        if (href && !isActive && !isRoot) {
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
