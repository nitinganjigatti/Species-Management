import { LoadingButton } from '@mui/lab'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import moment from 'moment'
import { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { DeleteEggById } from 'src/lib/api/egg/discard'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

const EggDisCarded = ({ eggList, getEggListSummary, fetchTableData, setDetailDrawer }) => {
  const theme = useTheme()

  console.log('eggList :>> ', eggList)

  const [iseOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [eggID, setEggId] = useState('')

  const handleOpenDeletePopUp = item => {
    setIsOpen(true)

    if (item) {
      // console.log('item :>> ', item?.egg_id)

      setEggId(item?.id)
    }

    // handleDelete()
  }

  const handleDelete = async () => {
    setLoading(true)

    const payload = {
      id: eggID
    }

    // console.log('params  handleDelete :>> ', payload)
    try {
      await DeleteEggById(payload).then(res => {
        console.log('res :>> ', res)

        if (res?.success) {
          setLoading(false)
          setIsOpen(false)
          if (getEggListSummary) {
            getEggListSummary()
          }
          setDetailDrawer(false)
          if (fetchTableData) {
            fetchTableData()
          }
          Toaster({ type: 'success', message: res.message })
        } else {
          setLoading(false)
          setIsOpen(false)
          Toaster({ type: 'error', message: res.message })
        }
      })
    } catch (error) {
      setLoading(false)
      console.log('error :>> ', error)
    }
  }

  return (
    <>
      {eggList?.length > 0 && (
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: '8px',
            width: '514px',
            my: 4,
            alignItems: 'center',
            ml: 4,

            display: 'flex',
            justifyContent: 'center',
            py: '20px',
            border: 1,
            borderColor: '#c3cec7'
          }}

          // onScroll={handleScroll}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {eggList?.map(item => (
              <Box
                key={item?.id}
                sx={{
                  width: '482px',
                  height: '104px',
                  border: '2px solid #FFD3D3',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: '70px',
                    height: '104px',
                    backgroundColor: '#FFD3D3',
                    borderLeft: '1px solid FFD3D3',
                    display: 'flex',
                    borderTopLeftRadius: '5px ',
                    borderBottomLeftRadius: '5px ',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.8
                  }}
                >
                  <Avatar src={'/icons/redEgg.png'} sx={{ width: '36.33px', height: '30px' }} />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: '500',
                      fontFamily: 'Inter',
                      position: 'relative',
                      lineHeight: '19.36px',
                      right: '10px'
                    }}
                  >
                    {' '}
                    {item?.common_name ? item?.common_name : '-'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      {' '}
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: '400',
                          fontFamily: 'Inter',
                          color: '#44544A',
                          position: 'relative',
                          right: '10px',

                          // bottom: '2px',
                          lineHeight: '19.36px'
                        }}
                      >
                        {item?.egg_code}
                      </Typography>
                    </Box>

                    <Stack
                      direction='row'
                      sx={{
                        width: 280,
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          px: 3,
                          backgroundColor: '#FFD3D3',
                          textAlign: 'center',
                          borderRadius: '4px',
                          opacity: 0.8
                        }}
                      >
                        <Tooltip title={item?.egg_condition} placement='bottom'>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: '500',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              color: '#E93353',
                              maxWidth: 100
                            }}
                          >
                            {item?.egg_condition}
                          </Typography>
                        </Tooltip>
                      </Box>
                      <IconButton onClick={() => handleOpenDeletePopUp(item)}>
                        <Icon icon='flowbite:trash-bin-outline' fontSize={24} />
                      </IconButton>
                    </Stack>
                    {/* <Box
                    sx={{
                      px: 3,
                      backgroundColor: '#FFD3D3',
                      textAlign: 'center',
                      borderRadius: '4px',
                      alignSelf: 'flex-start',
                      position: 'relative',
                      bottom: '0px'
                    }}
                  >
                    {' '}
                    <Tooltip title={item?.egg_state} placement='bottom'>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: '500',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          color: '#E93353',
                          maxWidth: 100
                        }}
                      >
                        {item?.egg_state}
                      </Typography>
                    </Tooltip>
                  </Box>
                  <Box sx={{ position: 'relative', left: '10px' }}>
                    <Icon icon='flowbite:trash-bin-outline' fontSize={24} />
                  </Box> */}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                      right: '12px'

                      // bottom: '10px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: '400',
                        fontFamily: 'Inter',
                        lineHeight: '16.94px'
                      }}
                    >
                      {/* {item.collection_date ? moment(item.collection_date).format('DD MMM YYYY') : '-'} */}
                      {item.collection_date ? Utility.formatDisplayDate(item.collection_date) : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={iseOpen} onClose={() => setOpenDiscardDialog(false)}>
        <Card
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            width: '500px',
            height: '342px',

            gap: '24px'
          }}
        >
          <Box sx={{ bgcolor: '#ffe5e5', p: '16px', borderRadius: '12px', mt: 10 }}>
            <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={'#E93353'} />
          </Box>
          <Box>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 600 }}>
              Do you want to remove egg?
            </Typography>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 400, mt: 2 }}
            >
              You are removing the egg from this discarded batch
            </Typography>
          </Box>
          {/* <Box sx={{ width: '100%', px: 4 }}>
          <TextField
            multiline
            rows={2}
            label='Add Comments*'
            variant='outlined'
            fullWidth
            value={comments} // Bind the value to state
            onChange={e => setComments(e.target.value)}
          />
        </Box> */}

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, p: 4 }}>
            <Button variant='outlined' fullWidth sx={{ p: 4 }} onClick={() => setIsOpen(false)}>
              CANCEL
            </Button>

            <LoadingButton variant='contained' fullWidth sx={{ p: 4 }} loading={loading} onClick={() => handleDelete()}>
              REMOVE
            </LoadingButton>
          </Box>
        </Card>
      </Dialog>
    </>
  )
}

export default EggDisCarded
