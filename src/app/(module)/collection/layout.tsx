'use client'

import { ReactNode } from 'react'
import RouteGuard from 'src/components/auth/RouteGuard'

interface CollectionLayoutProps {
  children: ReactNode
}

export default function CollectionLayout({ children }: CollectionLayoutProps) {
  return <RouteGuard accessFlag='enable_collection_in_web'>{children}</RouteGuard>
}
