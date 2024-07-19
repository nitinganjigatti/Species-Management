import React, { useRef, useState, Fragment, useEffect } from 'react'
import MenuItem from '@mui/material/MenuItem'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Icon from 'src/@core/components/icon'
import { usePariveshContext } from 'src/context/PariveshContext'
import { write } from 'src/lib/windows/utils' // Assuming write function is defined for localStorage operations
import { getOrganizationList } from 'src/lib/api/parivesh/addSpecies' // Importing API function
import { useRouter } from 'next/router'
import { Tooltip } from '@mui/material'

function SelectParivesh() {
  const router = useRouter()
  const { id, type } = router.query
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState(organizationList)

  useEffect(() => {
    // Fetch organization list if it's empty
    if (organizationList.length === 0) {
      fetchOrgData()
    }
  }, [])

  const anchorRef = useRef(null)

  const fetchOrgData = async () => {
    try {
      const res = await getOrganizationList({})
      setOptions(res)
      setSelectedParivesh(res[0])
    } catch (error) {
      console.error('Error fetching organization list:', error)
    }
  }

  const handleMenuItemClick = id => {
    const selected = options.find(el => el.id === id)
    setSelectedParivesh(selected)

    write('selectedParivesh', selected) // Update localStorage with selected organization
    setOpen(false)
    if (type === 'toBeSubmittedBatch' || type === 'submittedBatch') {
      router.back()
    }
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Fragment>
      <ButtonGroup variant='outlined' ref={anchorRef} aria-label='split button' sx={{ width: '17vw' }}>
        <Button>{selectedParivesh?.organization_name}</Button>
        <Button
          sx={{ px: '0' }}
          aria-haspopup='menu'
          onClick={handleToggle}
          aria-expanded={open ? 'true' : undefined}
          aria-controls={open ? 'split-button-menu' : undefined}
        >
          <Icon icon='mdi:menu-down' />
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal sx={{ width: '100%' }}>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu' sx={{ maxHeight: 200, overflowY: 'scroll', overflowX: 'hidden' }}>
                  {options?.map(option => (
                    <MenuItem
                      key={option.id}
                      selected={selectedParivesh?.id === option.id}
                      onClick={() => handleMenuItemClick(option.id)}
                    >
                      {option.organization_name.length > 24 ? (
                        <Tooltip title={option.organization_name} arrow>
                          <span>{`${option.organization_name.substring(0, 24)}...`}</span>
                        </Tooltip>
                      ) : (
                        option.organization_name
                      )}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  )
}

export default SelectParivesh

///////

// import React, { useRef, useState, Fragment, useEffect } from 'react'
// import MenuItem from '@mui/material/MenuItem'
// import Grow from '@mui/material/Grow'
// import Paper from '@mui/material/Paper'
// import Button from '@mui/material/Button'
// import Popper from '@mui/material/Popper'
// import MenuList from '@mui/material/MenuList'
// import ButtonGroup from '@mui/material/ButtonGroup'
// import ClickAwayListener from '@mui/material/ClickAwayListener'
// import Icon from 'src/@core/components/icon'
// import { usePariveshContext } from 'src/context/PariveshContext'
// import { write } from 'src/lib/windows/utils' // Assuming write function is defined for localStorage operations

// function SelectParivesh() {
//   const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
//   const [open, setOpen] = useState(false)
//   const [options, setOptions] = useState(organizationList)

//   useEffect(() => {
//     setOptions(organizationList)
//   }, [organizationList])

//   const anchorRef = useRef(null)

//   const handleMenuItemClick = id => {
//     const selected = options.find(el => el.id === id)
//     setSelectedParivesh(selected)
//     write('selectedParivesh', selected) // Update localStorage with selected organization
//     setOpen(false)
//   }

//   const handleToggle = () => {
//     setOpen(prevOpen => !prevOpen)
//   }

//   const handleClose = () => {
//     setOpen(false)
//   }

//   return (
//     <Fragment>
//       <ButtonGroup variant='outlined' ref={anchorRef} aria-label='split button'>
//         <Button>{selectedParivesh?.organization_name}</Button>
//         <Button
//           sx={{ px: '0' }}
//           aria-haspopup='menu'
//           onClick={handleToggle}
//           aria-expanded={open ? 'true' : undefined}
//           aria-controls={open ? 'split-button-menu' : undefined}
//         >
//           <Icon icon='mdi:menu-down' />
//         </Button>
//       </ButtonGroup>
//       <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal sx={{ width: '100%' }}>
//         {({ TransitionProps, placement }) => (
//           <Grow
//             {...TransitionProps}
//             style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
//           >
//             <Paper>
//               <ClickAwayListener onClickAway={handleClose}>
//                 <MenuList id='split-button-menu' sx={{ maxHeight: 200, overflowY: 'scroll', overflowX: 'hidden' }}>
//                   {options?.map((option, index) => (
//                     <MenuItem
//                       key={index}
//                       selected={selectedParivesh?.id === option.id}
//                       onClick={() => handleMenuItemClick(option.id)}
//                     >
//                       {option?.organization_name}
//                     </MenuItem>
//                   ))}
//                 </MenuList>
//               </ClickAwayListener>
//             </Paper>
//           </Grow>
//         )}
//       </Popper>
//     </Fragment>
//   )
// }

// export default SelectParivesh
//////////
// import React, { useEffect, useRef, useContext, useState, Fragment } from 'react'
// import { useRouter } from 'next/router'
// import MenuItem from '@mui/material/MenuItem'
// import { AuthContext } from 'src/context/AuthContext'
// import Grow from '@mui/material/Grow'
// import Paper from '@mui/material/Paper'
// import Button from '@mui/material/Button'
// import Popper from '@mui/material/Popper'
// import MenuList from '@mui/material/MenuList'
// import ButtonGroup from '@mui/material/ButtonGroup'
// import ClickAwayListener from '@mui/material/ClickAwayListener'
// import { readAsync, write } from 'src/lib/windows/utils'
// import { usePariveshContext } from 'src/context/PariveshContext'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// function SelectParivesh() {
//   // ** States
//   const [options, setOptions] = useState([])
//   const [open, setOpen] = useState(false)
//   const [selectedStore, setSelectedStore] = useState({ id: 'all', organization_name: 'All' })
//   const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()
//   const authData = useContext(AuthContext)
//   const router = useRouter()

//   const getStoreData = async () => {
//     const options = organizationList
//     setOptions(options)
//     const storedParivesh = await readAsync('storeParivesh')

//     const foundStored = () => {
//       if (options?.length > 0 && storedParivesh !== undefined) {
//         return options.some(item => item.id === storedParivesh?.id)
//       }
//       return false
//     }

//     const findSelectedParivesh = () => {
//       let foundParivesh = ''
//       if (options?.length > 0 && storedParivesh !== undefined) {
//         foundParivesh = options.find(item => item.id === storedParivesh?.id)
//       }

//       const areArraysEqual = JSON.stringify(foundParivesh?.permission) === JSON.stringify(storedParivesh?.permission)

//       // return areArraysEqual
//       if (areArraysEqual === false) {
//         write('storeParivesh', foundParivesh)
//         setSelectedParivesh(foundParivesh)
//       }
//     }

//     findSelectedParivesh()

//     if (storedParivesh === '' || foundStored() === false) {
//       if (selectedStore !== undefined) {
//         setSelectedStore(selectedStore)
//         write('storeParivesh', selectedStore)
//         setSelectedParivesh(selectedStore)
//       } else {
//       }
//     } else {
//       setSelectedStore(storedParivesh)
//     }
//   }

//   useEffect(() => {
//     getStoreData()
//   }, [])

//   const anchorRef = useRef(null)

//   const handleClick = () => {}

//   const handleMenuItemClick = id => {
//     const selected = options.filter(el => {
//       return el.id == id
//     })
//     console.log(selected, 'selected')

//     setSelectedStore(selected[0])
//     write('storeParivesh', selected[0])
//     setSelectedParivesh(selected[0])
//     setOpen(false)
//   }

//   const handleToggle = () => {
//     setOpen(prevOpen => !prevOpen)
//   }

//   const handleClose = () => {
//     setOpen(false)
//   }

//   return (
//     <Fragment>
//       <ButtonGroup variant='outlined' ref={anchorRef} aria-label='split button'>
//         <Button onClick={handleClick}>{selectedStore?.organization_name}</Button>

//         <Button
//           sx={{ px: '0' }}
//           aria-haspopup='menu'
//           onClick={handleToggle}
//           aria-label='select merge strategy'
//           aria-expanded={open ? 'true' : undefined}
//           aria-controls={open ? 'split-button-menu' : undefined}
//         >
//           <Icon icon='mdi:menu-down' />
//         </Button>
//       </ButtonGroup>
//       <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal sx={{ width: '100%' }}>
//         {({ TransitionProps, placement }) => (
//           <Grow
//             {...TransitionProps}
//             style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
//           >
//             <Paper>
//               <ClickAwayListener onClickAway={handleClose}>
//                 <MenuList id='split-button-menu' sx={{ maxHeight: 200, overflowY: 'scroll', overflowX: 'hidden' }}>
//                   {options?.map((option, index) => (
//                     <MenuItem
//                       key={index}
//                       selected={selectedStore ? selectedStore?.organization_name : null}
//                       onClick={event => handleMenuItemClick(option.id)}
//                     >
//                       {option?.organization_name}
//                     </MenuItem>
//                   ))}
//                 </MenuList>
//               </ClickAwayListener>
//             </Paper>
//           </Grow>
//         )}
//       </Popper>
//     </Fragment>
//   )
// }

// export default SelectParivesh
