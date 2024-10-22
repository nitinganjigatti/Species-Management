import { Avatar, Drawer, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import Utility from 'src/utility'

const ProbableParent = ({ probableParentSideBar, setProbableParentSideBar, parent, parentList }) => {
  const theme = useTheme()
  return (
    <Drawer
      anchor='right'
      open={probableParentSideBar}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 560], height: '100vh' } }}
    >
      <Box sx={{ height: '100%', backgroundColor: 'background.default' }}>
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ mt: 2 }}>
              <img src='/icons/activity_icon.png' alt='Grocery Icon' width='30px' />
            </Box>
            <Typography variant='h6'>
              {parentList?.length > 1 && 'Probable'} {parent} - {parentList?.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setProbableParentSideBar(false)}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: 'background.default',
            px: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pb: '24px'
          }}
        >
          {parentList?.length &&
            parentList?.map((item, i) => (
              <Box
                key={i}
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  paddingY: '20px',
                  paddingX: '16px',
                  border: '1px solid #C3CEC7',
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <Avatar
                    sx={{
                      '& > img': {
                        objectFit: item?.default_icon.endsWith('.svg') ? 'contain' : 'cover'
                      },
                      width: 44,
                      height: 44,
                      border: '1px solid #C3CEC7'
                    }}
                    alt={item?.default_icon}
                    src={item?.default_icon}
                  />
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: item?.type === 'group' ? '#00AFD6' : '#AFEFEB',
                      objectFit: 'cover'
                    }}
                    variant='rounded'
                  >
                    {item?.type === 'group' ? (
                      <Typography sx={{ fontSize: 14, color: '#fff' }}>G</Typography>
                    ) : item?.sex === 'male' ? (
                      <Typography sx={{ fontSize: 14 }}>M</Typography>
                    ) : item?.sex === 'female' ? (
                      <Typography sx={{ fontSize: 14 }}>F</Typography>
                    ) : item?.sex === 'undetermined' ? (
                      <Typography sx={{ fontSize: 14 }}>UD</Typography>
                    ) : item?.sex === 'indeterminate' ? (
                      <Typography sx={{ fontSize: 14 }}>ID</Typography>
                    ) : (
                      <Typography sx={{ fontSize: 14 }}>-</Typography>
                    )}
                  </Avatar>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  {item?.local_id_type && item?.local_identifier_value && (
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '19.36px'
                      }}
                    >
                      <span> {item?.local_id_type}: </span>
                      <span> {item?.local_identifier_value}</span>
                    </Typography>
                  )}

                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.animal_id}
                    {/* {Utility?.toPascalSentenceCase(item?.common_name)} */}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 600,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.common_name}
                    {/* {Utility?.toPascalSentenceCase(item?.common_name)} */}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      lineHeight: '19.36px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.scientific_name}
                    {/* {Utility?.toPascalSentenceCase(item?.scientific_name)} */}
                  </Typography>
                  {item?.type === 'group' && (
                    <Typography
                      sx={{
                        width: '250px',
                        paddingY: '4px',
                        borderRadius: '5px',
                        backgroundColor: theme.palette.customColors.mdAntzNeutral,
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '19.36px',
                        color: 'black'
                      }}
                    >
                      Count {item?.total_animal}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 600 }}> Encl: </span>
                    {item?.user_enclosure_name}
                    {/* {Utility?.toPascalSentenceCase(item?.user_enclosure_name)} */}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Sec: </span> {item?.section_name}
                    {/* {Utility?.toPascalSentenceCase(item?.section_name)} */}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: '16.94px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Site: </span>
                    {item?.site_name}
                    {/* {Utility?.toPascalSentenceCase(item?.site_name)} */}
                  </Typography>
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
    </Drawer>
  )
}

export default ProbableParent
