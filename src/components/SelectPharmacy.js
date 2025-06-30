import React, { useEffect, useRef, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import MenuItem from '@mui/material/MenuItem'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AuthContext } from 'src/context/AuthContext'

import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { readAsync, write } from 'src/lib/windows/utils'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

function truncateText(str, n) {
  return str?.length > n ? str.substr(0, n) + '...' : str
}

function SelectPharmacy() {
  // ** States
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [mounted, setMounted] = useState(false)

  const { selectedPharmacy, setSelectedPharmacy } = usePharmacyContext()
  const authData = useContext(AuthContext)
  const router = useRouter()

  const getStoreData = async () => {
    const pharmacy = authData?.userData?.modules?.pharmacy_data?.pharmacy[0]

    const options = authData?.userData?.modules?.pharmacy_data?.pharmacy?.sort((a, b) =>
      a?.name?.localeCompare(b?.name)
    )

    setOptions(options || [])
    const storedPharmacy = await readAsync('selectedStore')

    const foundStored = () => {
      if (options?.length > 0 && storedPharmacy !== undefined) {
        return options.some(item => item.id === storedPharmacy?.id)
      }

      return false
    }

    const findSelectedPharmacy = () => {
      let foundPharmacy = ''
      if (options?.length > 0 && storedPharmacy !== undefined) {
        foundPharmacy = options.find(item => item.id === storedPharmacy?.id)
      }

      const areArraysEqual = JSON.stringify(foundPharmacy?.permission) === JSON.stringify(storedPharmacy?.permission)

      if (areArraysEqual === false) {
        write('selectedStore', foundPharmacy)
        setSelectedPharmacy(foundPharmacy)
      }
    }

    findSelectedPharmacy()

    if (storedPharmacy === '' || foundStored() === false) {
      if (pharmacy !== undefined) {
        setSelectedStore(pharmacy)
        write('selectedStore', pharmacy)
        setSelectedPharmacy(pharmacy)
      }
    } else {
      setSelectedStore(storedPharmacy)
    }
  }

  const anchorRef = useRef(null)

  const handleClick = () => {}

  const handleMenuItemClick = id => {
    const selected = options.filter(el => {
      return el.id == id
    })

    setSelectedStore(selected[0])
    write('selectedStore', selected[0])
    setSelectedPharmacy(selected[0])
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    setMounted(true)
    getStoreData()
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <Box sx={{ minWidth: 'auto' }}>
      <ButtonGroup sx={{ width: '100%', minWidth: 250 }} variant='outlined' ref={anchorRef} aria-label='split button'>
        <Button
          sx={{
            width: '100%'
          }}
          onClick={handleClick}
        >
          {selectedStore?.name || 'Select Pharmacy'}
        </Button>

        <Button
          sx={{ px: '0' }}
          aria-haspopup='menu'
          onClick={handleToggle}
          aria-label='select merge strategy'
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
            <Paper
              sx={{
                minWidth: anchorRef.current ? anchorRef.current.clientWidth : undefined,
                width: 'auto'
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu' sx={{ maxHeight: 200, overflowY: 'scroll', overflowX: 'hidden' }}>
                  {options?.map((option, index) => (
                    <Tooltip title={option?.name || ''} placement='right' arrow key={option.id || index}>
                      <MenuItem
                        selected={selectedStore?.id === option.id}
                        onClick={() => handleMenuItemClick(option.id)}
                      >
                        {truncateText(option?.name, 25)}
                      </MenuItem>
                    </Tooltip>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

// Export with no SSR to prevent hydration issues
export default dynamic(() => Promise.resolve(SelectPharmacy), { ssr: false })
