import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material'
import moment from 'moment'
import Icon from 'src/@core/components/icon'

const EggDisCarded = ({ eggList }) => {
  return (
    <Card sx={{ width: '514px', m: 4, ml: 6 }}>
      <CardContent>
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
                  justifyContent: 'center'
                }}
              >
                <Avatar src={'/icons/redEgg.png'} sx={{ width: '36.33px', height: '30px' }} />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mt: 1
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
                  <Box>
                    {' '}
                    <Typography
                      sx={{
                        color: '#E93353',
                        fontSize: '14px',
                        fontWeight: '500',
                        px: 3,
                        backgroundColor: '#FFD3D3',
                        textAlign: 'center',
                        borderRadius: '4px',
                        alignSelf: 'flex-start',
                        position: 'relative',
                        bottom: '0px'
                      }}
                    >
                      {item?.egg_state}
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', left: '180px' }}>
                    <Icon icon='flowbite:trash-bin-outline' fontSize={24} />
                  </Box>
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
                    {' '}
                    {item.collection_date ? moment(item.collection_date).format('DD MMM YYYY') : '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default EggDisCarded
