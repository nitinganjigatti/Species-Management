// import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies' // Adjust the import path as necessary

// const PariveshContext = createContext()

// export const PariveshProvider = ({ children }) => {
//   const [selectedParivesh, setSelectedPariveshState] = useState(() => {
//     // Initialize from localStorage if available
//     if (typeof window !== 'undefined') {
//       const storedParivesh = localStorage.getItem('selectedParivesh')
//       return storedParivesh ? JSON.parse(storedParivesh) : undefined
//     } else {
//       return undefined // Fallback for non-browser environments
//     }
//   })
//   const [organizationList, setOrganizationList] = useState([])

//   const setSelectedParivesh = useCallback(newSelectedParivesh => {
//     setSelectedPariveshState(newSelectedParivesh)
//     // Update localStorage when selectedParivesh changes
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('selectedParivesh', JSON.stringify(newSelectedParivesh))
//     }
//   }, [])

//   useEffect(() => {
//     const token = localStorage.getItem('accessToken')
//     if (token) {
//       fetchOrgData(token)
//     }
//   }, [])

//   const fetchOrgData = useCallback(
//     async token => {
//       try {
//         const res = await getOrganizationList({})
//         if (res.length > 0) {
//           setOrganizationList(res)
//           // Check if selectedParivesh is set in localStorage
//           const storedParivesh = localStorage.getItem('selectedParivesh')
//           if (storedParivesh) {
//             setSelectedParivesh(JSON.parse(storedParivesh)) // Set selectedParivesh from localStorage
//           } else {
//             setSelectedParivesh(res[0]) // Set the first item in the response as default if not already selected
//             localStorage.setItem('selectedParivesh', JSON.stringify(res[0])) // Update localStorage with default
//           }
//         }
//       } catch (e) {
//         console.error('Error fetching organization list:', e)
//       }
//     },
//     [setSelectedParivesh]
//   )

//   return (
//     <PariveshContext.Provider value={{ selectedParivesh, setSelectedParivesh, organizationList }}>
//       {children}
//     </PariveshContext.Provider>
//   )
// }

// export const usePariveshContext = () => useContext(PariveshContext)

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
// import { getOrganizationList } from 'src/lib/api/parivesh'
import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'

const PariveshContext = createContext()

export const PariveshProvider = ({ children }) => {
  const [selectedParivesh, setSelectedPariveshState] = useState(() => {
    // Initialize from localStorage if available, otherwise default to 'All'
    if (typeof window !== 'undefined') {
      const storedParivesh = localStorage.getItem('selectedParivesh')
      return storedParivesh ? JSON.parse(storedParivesh) : { id: 'all', organization_name: 'All' }
    } else {
      return { id: 'all', organization_name: 'All' } // Fallback for non-browser environments
    }
  })
  const [organizationList, setOrganizationList] = useState([])

  const setSelectedParivesh = newSelectedParivesh => {
    setSelectedPariveshState(newSelectedParivesh)
    // Update localStorage when selectedParivesh changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedParivesh', JSON.stringify(newSelectedParivesh))
    }
  }

  const fetchOrgData = useCallback(async () => {
    try {
      const res = await getOrganizationList({})
      if (res.length > 0) {
        const optionsWithAll = [{ id: 'all', organization_name: 'All' }, ...res]
        setOrganizationList(optionsWithAll)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchOrgData()
  }, [fetchOrgData])

  return (
    <PariveshContext.Provider value={{ selectedParivesh, setSelectedParivesh, organizationList }}>
      {children}
    </PariveshContext.Provider>
  )
}

export const usePariveshContext = () => useContext(PariveshContext)

// import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'

// const PariveshContext = createContext()

// export const PariveshProvider = ({ children }) => {
//   const [selectedParivesh, setSelectedParivesh] = useState({ id: 'all', organization_name: 'All' })
//   const [organizationList, setOrganizationList] = useState([])

//   // Fetch organization data using useCallback for memoization
//   const fetchOrgData = useCallback(async () => {
//     try {
//       const res = await getOrganizationList({}) // Assuming getOrganizationList is defined elsewhere
//       console.log('res', res)

//       // Add an "All" option at the beginning
//       const optionsWithAll = [{ id: 'all', organization_name: 'All' }, ...res]
//       setOrganizationList(optionsWithAll)
//     } catch (e) {
//       console.error(e) // Use console.error for error messages
//     }
//   }, [])

//   // Fetch data on component mount
//   useEffect(() => {
//     fetchOrgData()
//   }, [fetchOrgData])

//   return (
//     <PariveshContext.Provider value={{ selectedParivesh, setSelectedParivesh, organizationList }}>
//       {children}
//     </PariveshContext.Provider>
//   )
// }

// export const usePariveshContext = () => useContext(PariveshContext)

// import React, { createContext, useContext, useState } from 'react'

// const PariveshContext = createContext()

// export const PariveshProvider = ({ children }) => {
//   const [selectedParivesh, setSelectedParivesh] = useState('')
//   const [organizationList, setOrganizationList] = useState([])

//   return (
//     <PariveshContext.Provider value={{ selectedParivesh, setSelectedParivesh, organizationList, setOrganizationList }}>
//       {children}
//     </PariveshContext.Provider>
//   )
// }

// export const usePariveshContext = () => useContext(PariveshContext)
