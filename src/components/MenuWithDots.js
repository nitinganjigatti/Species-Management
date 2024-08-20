// // ** React Imports
// import { useState } from 'react'

// // ** MUI Imports
// import Menu from '@mui/material/Menu'
// import MenuItem from '@mui/material/MenuItem'
// import IconButton from '@mui/material/IconButton'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // const options = ['Make It Available']
// // const ITEM_HEIGHT = 48

// const MenuWithDots = ({ option, action }) => {
//   // ** State
//   const [anchorEl, setAnchorEl] = useState(null)

//   const handleClick = event => {
//     setAnchorEl(event.currentTarget)
//   }

//   const handleClose = () => {
//     setAnchorEl(null)
//   }

//   return (
//     <div>
//       <IconButton aria-label='more' aria-controls='long-menu' aria-haspopup='true' onClick={handleClick}>
//         <Icon icon='mdi:dots-vertical' />
//       </IconButton>
//       <Menu
//         keepMounted
//         id='long-menu'
//         anchorEl={anchorEl}
//         onClose={handleClose}
//         open={Boolean(anchorEl)}

//         // PaperProps={{
//         //   style: {
//         //     maxHeight: ITEM_HEIGHT * 4.5
//         //   }
//         // }}
//       >
//         {/* {options.map(option => (
//           <MenuItem key={option} selected={option === 'Pyxis'} onClick={handleClose}>
//             {option}
//           </MenuItem>
//         ))} */}
//         <MenuItem
//           onClick={() => {
//             action()
//             handleClose()
//           }}
//         >
//           {option ? option : null}
//         </MenuItem>
//       </Menu>
//     </div>
//   )
// }

// export default MenuWithDots

import { useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'

const MenuWithDots = ({ options }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
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
    </div>
  )
}

export default MenuWithDots
