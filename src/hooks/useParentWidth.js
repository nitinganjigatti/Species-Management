import { useState, useEffect, useRef } from 'react'

const useParentWidth = () => {
  const parentRef = useRef(null)
  const [width, setWidth] = useState(null)

  useEffect(() => {
    if (!parentRef.current) return

    let resizeObserver

    // Check if ResizeObserver is available
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setWidth(entry.contentRect.width)
        }
      })
      resizeObserver.observe(parentRef.current)
    } else {
      // Fallback for browsers without ResizeObserver
      const handleResize = () => {
        setWidth(parentRef.current?.offsetWidth)
      }
      window.addEventListener('resize', handleResize)
      handleResize() // Initial call

      return () => window.removeEventListener('resize', handleResize)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return { parentRef, width }
}
export default useParentWidth;
