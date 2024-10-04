import { useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import Box from '@mui/material/Box'

const MenuWithDots = ({ options }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <IconButton aria-label='more' aria-controls='long-menu' aria-haspopup='true' onClick={handleClick}>
        <Icon icon='mdi:dots-vertical' />
      </IconButton>
      <Menu keepMounted id='long-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
        {options?.length > 0
          ? options?.map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  option.action()
                  handleClose()
                }}
              >
                {option.label}
              </MenuItem>
            ))
          : null}
      </Menu>
    </Box>
  )
}

export default MenuWithDots
