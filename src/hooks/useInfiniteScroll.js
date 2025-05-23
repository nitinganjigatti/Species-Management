import { useEffect } from 'react'

const useInfiniteScroll = ({ targetRef, onIntersect, enabled = true, rootMargin = '200px' }) => {
  useEffect(() => {
    if (!enabled || !targetRef?.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect()
        }
      },
      {
        rootMargin
      }
    )

    observer.observe(targetRef.current)

    return () => {
      if (targetRef.current) observer.unobserve(targetRef.current)
    }
  }, [enabled, onIntersect, targetRef, rootMargin])
}

export default useInfiniteScroll
