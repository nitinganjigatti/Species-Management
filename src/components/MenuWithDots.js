import { useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import Box from '@mui/material/Box'

const MenuWithDots = ({ options, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ textAlign: 'left' }}>
      <IconButton onClick={handleClick}>
        <Icon icon='mdi:dots-vertical' />
      </IconButton>
      <Menu
        sx={{
          minWidth: '400px',
          width: '400px',
          minHeight: '124px',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
          gap: '8px'
        }}
        keepMounted
        id='long-menu'
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {options?.length > 0
          ? options?.map((option, index) => (
              <MenuItem
                sx={{
                  color: 'customColors.neutralSecondary',
                  fontSize: '14px',
                  fontWeight: 400,
                  padding: '12px',
                  '&:hover': {
                    backgroundColor: 'customColors.displaybgPrimary'
                  }
                }}
                disabled={disabled}
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
