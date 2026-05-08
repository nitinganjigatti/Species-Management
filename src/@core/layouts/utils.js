/**
 * Check for URL queries as well for matching
 * Current URL & Item Path
 *
 * @param item
 * @param activeItem
 */
export const handleURLQueries = (router, path) => {
  if (Object.keys(router.query).length && path) {
    // Get pathname without query string to avoid matching paths in query parameters
    const pathWithoutQuery = router.asPath.split('?')[0]

    // Normalize trailing slashes on both sides — next.config has `trailingSlash: true`,
    // so the browser URL always ends with '/' but nav `path` strings may or may not.
    // Without this, `path + '/'` produces '//' and the startsWith check silently fails,
    // leaving parent nav items unhighlighted on detail/sub-pages.
    const normPath = path.replace(/\/+$/, '')
    const normCurrent = pathWithoutQuery.replace(/\/+$/, '')

    return (normCurrent === normPath || normCurrent.startsWith(normPath + '/')) && normPath !== ''
  }

  return false
}

/**
 * Check if the given item has the given url
 * in one of its children
 *
 * @param item
 * @param currentURL
 */
export const hasActiveChild = (item, currentURL) => {
  const { children } = item
  if (!children) {
    return false
  }

  // Normalize path by removing trailing slashes (except for root path)
  const normalizePath = (path) => {
    if (!path) return path
    return path === '/' ? '/' : path.replace(/\/$/, '')
  }

  const normalizedCurrentURL = normalizePath(currentURL)

  for (const child of children) {
    if (child.children) {
      if (hasActiveChild(child, currentURL)) {
        return true
      }
    }
    const childPath = child.path

    // Check if the child has a link and is active
    if (child && childPath && normalizedCurrentURL) {
      const normalizedChildPath = normalizePath(childPath)
      if (
        normalizedChildPath === normalizedCurrentURL ||
        (normalizedCurrentURL.includes(normalizedChildPath) && normalizedChildPath !== '/')
      ) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if this is a children
 * of the given item
 *
 * @param children
 * @param openGroup
 * @param currentActiveGroup
 */
export const removeChildren = (children, openGroup, currentActiveGroup) => {
  children.forEach(child => {
    if (!currentActiveGroup.includes(child.title)) {
      const index = openGroup.indexOf(child.title)
      if (index > -1) openGroup.splice(index, 1)

      // @ts-ignore
      if (child.children) removeChildren(child.children, openGroup, currentActiveGroup)
    }
  })
}
