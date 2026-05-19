import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const fetchBlob = async url => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Image fetch failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

// Strip expiry/sig params — use the stable image path as cache key
const stableKey = src => {
  try {
    const u = new URL(src)
    return u.searchParams.get('path') || src
  } catch {
    return src
  }
}

// Tracks object URLs so we can revoke them when they're replaced
const objUrlRegistry = new Map()

export const useCachedImage = src => {
  const queryClient = useQueryClient()
  const prevSrc = useRef(null)

  const { data: objectUrl } = useQuery({
    queryKey: ['cached-image', stableKey(src)],
    queryFn: () => fetchBlob(src),
    enabled: Boolean(src),
    staleTime: Infinity,   // keep for the whole session
    gcTime: 30 * 60_000,   // release after 30 min of no use
    retry: 1
  })

  // Revoke old object URL when src changes or component unmounts
  useEffect(() => {
    if (objectUrl) {
      const prev = objUrlRegistry.get(src)
      if (prev && prev !== objectUrl) URL.revokeObjectURL(prev)
      objUrlRegistry.set(src, objectUrl)
    }
  }, [src, objectUrl])

  // On unmount, mark for GC but don't revoke immediately (other instances may use it)
  useEffect(() => {
    return () => {
      prevSrc.current = src
    }
  }, [src])

  return objectUrl || src  // fall back to original URL while loading
}
