'use client'

import { FC, useState } from 'react'
import { LoadingButton } from '@mui/lab'
import { Avatar, Box, Button, Card, Dialog, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { DeleteEggById } from 'src/lib/api/egg/discard'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import type { EggDiscardedProps } from 'src/types/egg/components'

interface EggListItem {
  id: string | number
  common_name: string
  egg_code: string
  egg_condition: string
  collection_date: string
}

const EggDisCarded: FC<EggDiscardedProps & { eggList: EggListItem[]; getEggListSummary: () => void; fetchTableData: () => void; setDetailDrawer: (open: boolean) => void }> = ({
  eggList,
  getEggListSummary,
  fetchTableData,
  setDetailDrawer
}) => {
  const theme = useTheme()

  const [iseOpen, setIsOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [eggID, setEggId] = useState<string | number>('')

  const handleOpenDeletePopUp = (item: EggListItem) => {
    setIsOpen(true)

    if (item) {
      setEggId(item?.id)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    const payload = { id: eggID }

    try {
      const res = await DeleteEggById(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res.message })
        if (getEggListSummary) getEggListSummary()
        if (fetchTableData) fetchTableData()
        setDetailDrawer(false)
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to delete egg record' })
      }
    } catch (error) {
      console.error('DeleteEggById error:', error)
      Toaster({ type: 'error', message: 'Something went wrong while deleting the egg' })
    } finally {
      setLoading(false)
      setIsOpen(false)
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
            borderColor: theme.palette.customColors.OutlineVariant
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {eggList?.map(item => (
              <Box
                key={item?.id}
                sx={{
                  width: '482px',
                  height: '104px',
                  border: `2px solid ${theme.palette.customColors.AntzTertiary}`,
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
                    backgroundColor: theme.palette.customColors.AntzTertiary,
                    borderLeft: `1px solid ${theme.palette.customColors.AntzTertiary}`,
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
                    {item?.common_name ? item?.common_name : 'unknown'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: '400',
                          fontFamily: 'Inter',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          position: 'relative',
                          right: '10px',
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
                          backgroundColor: theme.palette.customColors.AntzTertiary,
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
                              color: theme.palette.customColors.Error,
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
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                      right: '12px'
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
                      {item.collection_date ? Utility.formatDisplayDate(item.collection_date) : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={iseOpen} onClose={() => setIsOpen(false)}>
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
          <Box
            sx={{
              bgcolor: theme.palette.customColors.TertiaryLight,
              p: '16px',
              borderRadius: '12px',
              mt: 10
            }}
          >
            <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={theme.palette.customColors.Error} />
          </Box>
          <Box>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 600 }}>
              Do you want to remove egg?
            </Typography>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 400, mt: 2 }}
            >
              The egg will be removed from the discarded batch
            </Typography>
          </Box>
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
