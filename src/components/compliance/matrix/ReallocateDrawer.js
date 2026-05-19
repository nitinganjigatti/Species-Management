import Drawer from '@mui/material/Drawer'
import ReallocateForm from './ReallocateForm'

const ReallocateDrawer = ({ editing, onClose, onSaved }) => {
  const open = Boolean(editing)

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 540 },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }
        }
      }}
    >
      {editing && (
        <ReallocateForm
          editing={editing}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Drawer>
  )
}

export default ReallocateDrawer
