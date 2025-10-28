import {
  Avatar,
  Box,
  Card,
  CardContent,
  Drawer,
  Grid,
  IconButton,
  Typography,
  Tab,
  Divider,
  Chip,
  Stack,
  Tooltip
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'

import AddGallery from '../../../../../components/egg/AddGallery'
import EggDisCarded from '../../../../../components/egg/EggDiscarded'
import { DeleteEggById, GetDiscardedEggList, GetDiscardedSummary } from 'src/lib/api/egg/discard'
import { position } from 'stylis'
import { getGalleryImgList } from 'src/lib/api/egg/egg'
import Utility from 'src/utility'

const DiscardDetail = ({ setDetailDrawer, detailDrawer, eggDiscardedId, fetchTableData }) => {
  const theme = useTheme()
  const [status, setStatus] = useState('Overview')
  const [summary, setSummary] = useState({})
  const [eggList, setEggList] = useState([])
  const [galleryList, setGalleryList] = useState([])

  let [eggListPage, setEggListPage] = useState(1)

  const [reachedEnd, setReachedEnd] = useState(false)

  const [eggId, setEggId] = useState('')

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', width: '250px' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const handleChange = (event, newValue) => {
    // setTotal(0)
    setStatus(newValue)
  }

  const getSummary = async id => {
    const params = {
      egg_discard_id: id
    }
    try {
      const res = await GetDiscardedSummary(params)
      setSummary(res?.data?.data)
    } catch (e) {
      console.error(e)
    }
  }

  const getEggListSummary = async id => {
    const params = {
      egg_discard_id: id ? id : eggDiscardedId
    }
    try {
      const res = await GetDiscardedEggList(params)
      setEggList(res?.data?.data?.result)
    } catch (e) {
      console.error(e)
    }
  }

  const GetGalleryImgListFunc = id => {
    try {
      getGalleryImgList({ ref_id: id, ref_type: 'egg_discard' }).then(res => {
        if (res.success) {
          setGalleryList(res?.data?.result)
        } else {
        }
      })
    } catch (error) {
      console.error('error', error)
    }
  }

  const handelOnclose = () => {
    setDetailDrawer(false)
    setEggList([])
    setGalleryList([])
    setStatus('Overview')
  }

  useEffect(() => {
    if (eggDiscardedId && detailDrawer) {
      if (status === 'Overview') {
        getSummary(eggDiscardedId)
        GetGalleryImgListFunc(eggDiscardedId)
        getEggListSummary(eggDiscardedId)
      }
    }
  }, [detailDrawer, status])

  const handleScroll = async e => {
    const container = e.target

    // Check if the user has reached the bottom
    if (status === 'eggs_list') {
      // console.log('container.scrollTop :>> ', container.scrollHeight)
      // console.log('container.scrollTop:>> ', container.scrollTop)
      // console.log('container.clientHeight :>> ', container.clientHeight)

      if (container.scrollHeight - Math.round(container.scrollTop) === container.clientHeight) {
        // User has reached the bottom, perform your action here

        setEggListPage(++eggListPage)
        setReachedEnd(true)

        try {
          const params = { page: eggListPage, egg_discard_id: eggDiscardedId }
          await GetDiscardedEggList(params).then(res => {
            if (res?.data?.result?.length > 0) {
              setIngredientList(prevArray => [...prevArray, ...res?.data?.result])
              setReachedEnd(false)
            } else {
              setReachedEnd(false)
            }
          })
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={detailDrawer}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' }
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            <Typography variant='h6'>Discard Details</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => handelOnclose()} />
            </IconButton>
          </Box>
        </Box>

        <TabContext value={status} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <TabList onChange={handleChange} sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tab value='Overview' label={<TabBadge label='Overview' />} />
            <Tab
              value='Eggs'
              label={<TabBadge label={'Eggs' + (summary?.egg_count > '0' ? ' - ' + eggList?.length : '')} />}
            />
          </TabList>
          <TabPanel value='Overview' sx={{ p: 0 }}>
            {' '}
            <Divider sx={{ width: '200px' }} />
            {/* {tableData()} */}
          </TabPanel>
          <TabPanel value='eggs_list' sx={{ p: 0 }}>
            <Divider />
            {/* {tableData()} */}
          </TabPanel>
        </TabContext>

        <Box
          className='sidebar-body'
          onScroll={handleScroll}
          sx={{
            backgroundColor: 'background.default',
            height: '90%',
            overflowY: 'auto'
          }}
        >
          {status === 'Overview' ? (
            <Box sx={{ mb: 20 }}>
              <Box sx={{ px: 4 }}>
                <Box
                  sx={{
                    mt: 4,
                    p: '20px 16px 20px 16px',
                    bgcolor: theme.palette.primary.contrastText,
                    borderRadius: '8px',
                    gap: '24px',
                    border: 1,
                    borderColor: theme.palette.customColors.OutlineVariant
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '24px' }}>
                    <Box sx={{ p: 1, width: '135px', height: '135px' }}>
                      <img
                        src={summary?.qr_code ? summary?.qr_code : '/icons/Incubator_CON.png'}
                        style={{ width: '100%', height: '100%' }}
                        alt='QR Code'
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '340px' }}>
                      <Box
                        sx={{
                          bgcolor: theme.palette.customColors.AntzTertiary,
                          widows: '340px',
                          height: '60px',
                          px: '12px',
                          py: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px',
                          opacity: 0.8
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={'/icons/bar.png'}
                            sx={{
                              width: '20px',
                              height: '20px'
                            }}
                          />

                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Nursery
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            color: theme.palette.customColors.OnSurfaceVariant,
                            ml: 7
                          }}
                        >
                          {summary?.nursery_name ? summary?.nursery_name : '-'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: theme.palette.customColors.AntzTertiary,
                          widows: '340px',
                          height: '60px',
                          px: '12px',
                          py: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          borderBottomLeftRadius: '8px',
                          borderBottomRightRadius: '8px',
                          opacity: 0.8
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={'/icons/trash.png'}
                            sx={{
                              width: '20px',
                              height: '20px'
                            }}
                          />

                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              color: theme.palette.customColors.OnSurfaceVariant
                            }}
                          >
                            Discard
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            color: theme.palette.customColors.OnSurfaceVariant,
                            ml: 7
                          }}
                        >
                          {summary?.egg_count ? summary?.egg_count : '-'}{' '}
                          {Number(summary?.egg_count) <= 1 ? 'Egg' : 'Eggs'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: '100%',
                      height: '64px',
                      borderRadius: '8px',
                      gap: '12px',
                      bgcolor: theme.palette.customColors.antzNotes,
                      mt: '20px',
                      p: '12px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Notes
                    </Typography>
                    <Tooltip
                      title={
                        <div
                          style={{
                            maxHeight: 150,
                            overflowY: 'auto',
                            whiteSpace: 'normal',

                        
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-block',
                              width: '100%',
                              height: '100%',
                              scrollbarWidth: 'thin',

                              WebkitScrollbarWidth: 'thin'
                            }}
                          >
                            {summary?.reason ? summary?.reason : '-'}
                          </div>
                          <style>
                            {`
                              div::-webkit-scrollbar {
                                width: 6px;
                              }
                              div::-webkit-scrollbar-thumb {
                                background-color: rgba(255, 255, 255, 0.2);
                                border-radius: 4px;
                              }
                              div::-webkit-scrollbar-track {
                                background: transparent;
                              }
                           `}
                          </style>
                        </div>
                      }
                    >
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '16px',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          lineHeight: '19.36px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {summary?.reason ? summary?.reason : '-'}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              {galleryList?.length ? (
                <>
                  <Typography
                    sx={{
                      mt: 6,
                      ml: 4,
                      fontSize: '20px',
                      fontWeight: 500,
                      fontFamily: 'Inter',
                      lineHeight: '24.2px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Added Photos
                  </Typography>

                  <Box sx={{ mb: summary?.activity_status === 'DISCARD_REQUEST_GENERATED' ? null : 45 }}>
                    <AddGallery galleryList={galleryList} />
                  </Box>
                </>
              ) : null}

              {summary?.activity_status === 'DISCARD_REQUEST_GENERATED' ? (
                <Box
                  sx={{
                    width: '562px',
                    height: '82px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: theme.palette.background.paper,
                    position: 'fixed',
                    bottom: 0
                  }}
                >
                  <Stack
                    direction='row'
                    sx={{
                      gap: 2,
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ width: '24px', height: '24px' }}>
                      <img src='/icons/pending_security_check_icon.png' style={{ width: '100%' }} alt='Pending' />
                    </Box>
                    <Typography sx={{ textTransform: 'uppercase', fontSize: '15px', fontWeight: 500 }}>
                      Security Check Pending
                    </Typography>
                  </Stack>
                </Box>
              ) : summary?.activity_status === 'COMPLETED' ? (
                <Box
                  sx={{
                    width: '562px',
                    height: '174px',
                    display: 'flex',
                    justifyContent: 'center',
                    px: '24px',
                    py: '16px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: theme.palette.background.paper,
                    position: 'fixed',
                    bottom: 0,
                    gap: '16px'
                  }}
                >
                  <Box
                    sx={{
                      width: '530px',
                      height: '86px',
                      p: '12px',
                      display: 'flex',
                      gap: '12px',
                      borderRadius: '8px',
                      bgcolor: theme.palette.customColors.AntzTertiary
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Avatar
                        variant='circular'
                        alt='User Profile'
                        sx={{
                          width: 30,
                          height: 30,
                          mr: 4,
                          borderRadius: '50%',
                          background: theme.palette.customColors.displaybgPrimary,
                          overflow: 'hidden'
                        }}
                      >
                        {summary.profile_pic ? (
                          <img
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            src={summary.profile_pic}
                            alt='Profile'
                          />
                        ) : (
                          <Icon icon='mdi:user' fontSize={25} color={theme.palette.customColors.Tertiary} />
                        )}
                      </Avatar>

                      <Stack>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                          {summary.discarded_person_name}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '458px'
                          }}
                        >
                          <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{summary?.site_name}</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                            {Utility.formatDisplayDate(Utility.convertUTCToLocal(summary?.requested_on))}
                            <Icon icon='mdi:dot' />

                            {Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(summary?.requested_on))}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.Error }}>
                          {summary?.comments ? summary?.comments : '-'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                  <Box>
                    <Stack
                      direction='row'
                      sx={{
                        gap: 2,
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ width: '24px', height: '24px' }}>
                        <img
                          src='/icons/security_check_icon.png'
                          style={{ width: '100%', height: '100%' }}
                          alt='Pending'
                        />
                      </Box>
                      <Typography
                        sx={{
                          textTransform: 'uppercase',
                          fontSize: '15px',
                          fontWeight: 500,
                          color: theme.palette.primary.main
                        }}
                      >
                        Security Checked
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                summary?.activity_status === 'CANCELED' && (
                  <Box
                    sx={{
                      width: '562px',
                      height: '174px',
                      display: 'flex',
                      justifyContent: 'center',
                      px: '24px',
                      py: '16px',
                      flexDirection: 'column',
                      alignItems: 'center',
                      bgcolor: theme.palette.background.paper,
                      position: 'fixed',
                      bottom: 0,
                      gap: '16px'
                    }}
                  >
                    <Box
                      sx={{
                        width: '530px',
                        height: '86px',
                        p: '12px',
                        display: 'flex',
                        gap: '12px',
                        borderRadius: '8px',
                        bgcolor: theme.palette.customColors.AntzTertiary
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Avatar
                          variant='circular'
                          alt='User Profile'
                          sx={{
                            width: 30,
                            height: 30,
                            mr: 4,
                            borderRadius: '50%',
                            background: theme.palette.customColors.tableHeaderBg,
                            overflow: 'hidden'
                          }}
                        >
                          {summary.profile_pic ? (
                            <img
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              src={summary.profile_pic}
                              alt='Profile'
                            />
                          ) : (
                            <Icon icon='mdi:user' fontSize={25} color={theme.palette.customColors.Tertiary} />
                          )}
                        </Avatar>

                        <Stack>
                          <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                            {summary.commented_by ? summary.commented_by : '-'}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '458px'
                            }}
                          >
                            <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>{summary?.site_name}</Typography>
                            <Typography sx={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                              {summary?.commented_on
                                ? Utility.formatDisplayDate(Utility.convertUTCToLocal(summary?.commented_on))
                                : '-'}
                              <Icon icon='mdi:dot' />

                              {summary?.commented_on
                                ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(summary?.commented_on))
                                : '-'}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.Error }}
                          >
                            {summary?.comments ? summary?.comments : '-'}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                    <Box>
                      <Stack
                        direction='row'
                        sx={{
                          gap: 2,
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ width: '24px', height: '24px' }}>
                          <img
                            src='/icons/pending_security_check_icon.png'
                            style={{ width: '100%', height: '100%' }}
                            alt='Pending'
                          />
                        </Box>
                        <Typography
                          sx={{
                            textTransform: 'uppercase',
                            fontSize: '15px',
                            fontWeight: 500,
                            color: theme.palette.customColors.Tertiary
                          }}
                        >
                          Canceled
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                )
              )}
            </Box>
          ) : (
            <EggDisCarded
              eggList={eggList}
              getEggListSummary={getEggListSummary}
              fetchTableData={fetchTableData}
              setDetailDrawer={setDetailDrawer}
            />
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default DiscardDetail
