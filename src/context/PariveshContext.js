import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'

const PariveshContext = createContext()

export const PariveshProvider = ({ children }) => {
  const [selectedParivesh, setSelectedPariveshState] = useState(() => {
    // Initialize from localStorage if available, otherwise default to null
    if (typeof window !== 'undefined') {
      const storedParivesh = localStorage.getItem('selectedParivesh')
      return storedParivesh ? JSON.parse(storedParivesh) : null
    }
    return null // Fallback for non-browser environments
  })
  const [organizationList, setOrganizationList] = useState([])

  const fetchOrgData = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      // Handle case where accessToken is not available
      if (!accessToken) {
        // console.error('Access token not found.')
        return
      }

      const res = await getOrganizationList({ accessToken })
      if (res.length > 0) {
        setOrganizationList(res)

        // Initialize selectedParivesh with the first organization from res if not already set
        setSelectedPariveshState(prevState => {
          if (!prevState) {
            const newState = res[0]
            localStorage.setItem('selectedParivesh', JSON.stringify(newState))
            return newState
          }
          return prevState // Assuming res[0] is defined and not null
        })
      }
    } catch (e) {
      console.error('Error fetching organization list:', e)
      // Consider adding user-facing error handling here
    }
  }, []) // Removed selectedParivesh from dependency array

  const setSelectedParivesh = useCallback(newSelectedParivesh => {
    setSelectedPariveshState(newSelectedParivesh)
    // Update localStorage when selectedParivesh changes
    localStorage.setItem('selectedParivesh', JSON.stringify(newSelectedParivesh))
  }, [])

  // const setOrganizationListState = orgarnisationList => {
  //   setOrganizationList(orgarnisationList)
  // }

  useEffect(() => {
    // debugger
    fetchOrgData()
  }, [fetchOrgData])

  return (
    <PariveshContext.Provider
      value={{
        selectedParivesh,
        setSelectedParivesh,
        organizationList,
        setOrganizationList // Use this directly instead of setOrganizationListState
      }}
    >
      {children}
    </PariveshContext.Provider>
  )
}

export const usePariveshContext = () => {
  const context = useContext(PariveshContext)
  if (!context) {
    throw new Error('usePariveshContext must be used within a PariveshProvider')
  }
  return context
}

// import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// // Assuming getOrganizationList is correctly imported
// import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies'

// const PariveshContext = createContext()

// export const PariveshProvider = ({ children }) => {
//   const [selectedParivesh, setSelectedPariveshState] = useState(() => {
//     // Initialize from localStorage if available, otherwise default to null
//     if (typeof window !== 'undefined') {
//       const storedParivesh = localStorage.getItem('selectedParivesh')

//       return storedParivesh ? JSON.parse(storedParivesh) : null
//     } else {
//       return null // Fallback for non-browser environments
//     }
//   })
//   const [organizationList, setOrganizationList] = useState([])

//   const fetchOrgData = useCallback(async () => {
//     try {
//       const accessToken = localStorage.getItem('accessToken')
//       if (!accessToken) {
//         // Handle case where accessToken is not available
//         // console.error('Access token not found.')
//         return
//       }

//       const res = await getOrganizationList({ accessToken })
//       if (res.length > 0) {
//         setOrganizationList(res)

//         // Initialize selectedParivesh with the first organization from res if not already set
//         if (!selectedParivesh) {
//           setSelectedPariveshState(res[0]) // Assuming res[0] is defined and not null
//           localStorage.setItem('selectedParivesh', JSON.stringify(res[0]))
//         }
//       }
//     } catch (e) {
//       console.error('Error fetching organization list:', e)
//     }
//   }, [selectedParivesh])

//   const setSelectedParivesh = newSelectedParivesh => {
//     setSelectedPariveshState(newSelectedParivesh)

//     // Update localStorage when selectedParivesh changes
//     localStorage.setItem('selectedParivesh', JSON.stringify(newSelectedParivesh))
//   }

//   const setOrganizationListState = orgarnisationList => {
//     setOrganizationList(orgarnisationList)
//   }

//   useEffect(() => {
//     debugger
//     fetchOrgData() // Initial fetch on component mount
//   }, [fetchOrgData])

//   return (
//     <PariveshContext.Provider
//       value={{ selectedParivesh, setSelectedParivesh, organizationList, setOrganizationListState }}
//     >
//       {children}
//     </PariveshContext.Provider>
//   )
// }

// export const usePariveshContext = () => useContext(PariveshContext)

/////////////////////

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
