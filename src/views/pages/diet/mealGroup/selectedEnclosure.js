import { Box, Card, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import { useState } from 'react'

const SelectedEnclosure = ({
  selectedEnclosureDrawer,
  setSelectedEnclosureDrawer,
  selectedItems,
  selectEnclosures,
  selectedEnclosureIds,
  setSelectedEnclosureIds,
  checkedRows,
  setSelectedItems,
  setCheckedRows
}) => {
  const theme = useTheme()
  const [selectedEnclosures, setSelectedEnclosures] = useState(selectEnclosures)

  const handleRemove = index => {
    const itemToRemove = selectedItems[index] // Get the item being removed

    const updatedItems = selectedEnclosures.filter((_, i) => i !== index)

    // Extract the IDs from the updatedItems
    const updatedIds = updatedItems.map(item => item.enclosure_id)

    // Optional: if you want to update checkedRows separately
    const updatedChecked = updatedItems

    setSelectedEnclosures(updatedItems) // update the list of selected enclosures
    setSelectedEnclosureIds(updatedIds) // update just the IDs for checking checkboxes
    setCheckedRows(updatedChecked) // if you have a separate checkedRows state
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={selectedEnclosureDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: '100%', maxWidth: '562px' },
          // position: 'fixed',
          position: 'relative',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg,
          gap: '24px'
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.customColors.bodyBg,
            zIndex: 10,
            height: 'calc(100dvh - 0px)'
          }}
        >
          {/* Header */}
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px', fontWeight: 500 }}
              >
                Selected enclosures
              </Typography>
            </Box>

            <IconButton
              size='small'
              onClick={() => {
                setSelectedEnclosureDrawer(false)
                // setEditItems([])
                // setSelectedItems([])
              }}
              sx={{ color: theme.palette.primary.light, mt: 2 }}
            >
              {<Icon icon='mdi:close' fontSize={25} />}
            </IconButton>
          </Box>

          {/* Body */}
          <Box sx={{}}>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2 }}>
              {selectedEnclosures.map((item, index) => (
                <Box sx={{ m: 3 }}>
                  {' '}
                  {/* Adds margin around the Card */}
                  <Card
                    key={index}
                    sx={{
                      p: 4,
                      width: '100%',
                      height: '70px',
                      borderTop: selectedEnclosureIds.includes(item?.enclosure_id) && `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderLeft: selectedEnclosureIds.includes(item?.enclosure_id) && `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRight: selectedEnclosureIds.includes(item?.enclosure_id) && `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderTopLeftRadius: selectedEnclosureIds.includes(item?.enclosure_id) && '8px',
                      borderTopRightRadius: selectedEnclosureIds.includes(item?.enclosure_id) && '8px',
                      borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      bgcolor: selectedEnclosureIds.includes(item?.enclosure_id) && 'white',
                      borderRadius: selectedEnclosureIds.includes(item?.enclosure_id) ? '8px' : '2px',
                      display: 'flex',
                      boxShadow: 'none',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                        {item.user_enclosure_name}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '14px',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          maxWidth: '100px',
                          // overflow: 'hidden',
                          // textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.section_name}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100px',
                        alignItems: 'flex-start',
                        ml: 'auto'
                      }}
                    >
                      <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant  }}>Species: {item.species_count}</Typography>
                      <Typography sx={{ fontSize: '14px', color: theme.palette.customColors.OnSurfaceVariant  }}>Animals: {item.animal_count}</Typography>
                    </Box>

                    {/* <Checkbox
                        checked={selectedEnclosureIds.includes(item.enclosure_id)}
                        onChange={() => handleCheckboxChange(item?.enclosure_id)}
                      /> */}
                    <IconButton size='medium' sx={{ color: 'text.primary' }} onClick={() => handleRemove(index)}>
                      {/* <Icon icon='mdi:close' sx={{ fontSize: '24px' }} /> */}
                      <img src='/images/cancel.png' width='20px' />
                    </IconButton>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
export default SelectedEnclosure
