'use client'

import { ReactNode } from 'react'
import RouteGuard from 'src/components/auth/RouteGuard'
import { ACCESS_FLAGS } from 'src/constants/accessFlags'

interface CollectionLayoutProps {
  children: ReactNode
}

export default function CollectionLayout({ children }: CollectionLayoutProps) {
  return <RouteGuard accessFlag={ACCESS_FLAGS.collection}>{children}</RouteGuard>
}
