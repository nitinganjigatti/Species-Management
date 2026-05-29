// ** React Imports
import { Fragment, useEffect } from 'react'

// ** MUI Imports
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'

const Sidebar = props => {
  // ** Props
  const { sx, show, direction, children, hideBackdrop, onOpen, onClose, backDropClick } = props

  const handleBackdropClick = () => {
    if (backDropClick) {
      backDropClick()
    }
  }
  useEffect(() => {
    if (show && onOpen) {
      onOpen()
    }
    if (show === false && onClose) {
      onClose()
    }
  }, [onClose, onOpen, show])

  return (
    <Fragment>
      <Box
        sx={{
          top: 0,
          height: '100%',
          zIndex: 'drawer',
          position: 'absolute',
          transition: 'all 0.25s ease-in-out',
          backgroundColor: 'background.paper',
          // Closed sidebars must NOT intercept clicks. opacity: 0 alone
          // still receives pointer events, and the slide-off (`right: -100%`)
          // is not always enough — the closed panel can still overlap
          // siblings (e.g. MessageInfoDialog covering the chat header's
          // enlarge icon). Gate pointer events on `show` so a hidden
          // sidebar is fully transparent to taps.
          pointerEvents: show ? 'auto' : 'none',
          ...(show ? { opacity: 1 } : { opacity: 0 }),
          ...(direction === 'right'
            ? { left: 'auto', right: show ? 0 : '-100%' }
            : { right: 'auto', left: show ? 0 : '-100%' }),
          ...sx
        }}
      >
        {children}
      </Box>
      {hideBackdrop ? null : (
        <Backdrop
          open={show}
          transitionDuration={250}
          onClick={handleBackdropClick}
          sx={{ position: 'absolute', zIndex: theme => theme.zIndex.drawer - 1 }}
        />
      )}
    </Fragment>
  )
}

export default Sidebar

Sidebar.defaultProps = {
  direction: 'left'
}
