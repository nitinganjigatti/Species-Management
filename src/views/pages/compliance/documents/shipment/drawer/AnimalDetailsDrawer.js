import React from 'react'
import { Typography, Box, Drawer, IconButton, Paper, Grid, Chip, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'

const AnimalDetailsDrawer = ({
  open,
  onClose,
  title,
  animalDetails,
  detailtype,
  setanimalCountDrawerOpen,
  setCurrentSpeciesId,
  setSelectedSpeciesData
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { action } = router.query
  const handleClick = () => {
    setanimalCountDrawerOpen(true)
    setCurrentSpeciesId(animalDetails.tsn_id)
    setSelectedSpeciesData(animalDetails)
  }

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
     
        <Box sx={{ px: 5, pt: 4, pb: 4 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            {detailtype === 'others' && action !== 'details' ? (
              <Typography
                sx={{
                  color: '#006D35',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: '30%'
                }}
                onClick={handleClick}
              >
                <Icon
                  style={{
                    fontSize: '18px',
                    cursor: 'pointer',
                    marginRight: '8px',
                    color: '#006D35'
                  }}
                  icon='bx:pencil'
                />
                Edit Selection
              </Typography>
            ) : (
              ''
            )}

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: '20px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: '#44544A',
              mb: 4
            }}
          >
            Species
          </Typography>

          <Paper
            elevation={1}
            sx={{
              borderRadius: '10px',
              padding: 4,
              border: '1px solid #C3CEC7',
              boxShadow: 'none'
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Species Name</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {animalDetails?.common_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Scientific Name</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {animalDetails?.scientific_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>CITES</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {animalDetails?.cites || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Animal count</Typography>
                <Typography fontWeight={500} sx={{ mt: 0.5, color: '#44544A', fontSize: '16px' }}>
                  {animalDetails?.total_count ||
                    animalDetails?.male_count + animalDetails?.female_count + animalDetails?.undeterminate_count ||
                    '-'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '16px' }}>Gender & Count</Typography>
                <Box display='flex' gap={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`M - ${animalDetails?.male_count || 0}`}
                    size='small'
                    sx={{
                      background: '#AFEFEB80',
                      borderRadius: '4px',
                      px: 3,
                      color: '#00AFD6',
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`F - ${animalDetails?.female_count || 0}`}
                    size='small'
                    sx={{
                      background: '#FA614026',
                      borderRadius: '4px',
                      px: 3,
                      color: '#FA6140',
                      fontSize: '14px',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  <Chip
                    label={`U - ${animalDetails?.undeterminate_count || 0}`}
                    size='small'
                    sx={{
                      background: '#DDEBE9',
                      borderRadius: '4px',
                      px: 3,
                      color: '#1F515B',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Box sx={{ px: '20px', pb: 2 }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '18px',
              color: '#44544A',
              mb: 4,
              mt: 4
            }}
          >
            Animals with identifier ( {animalDetails?.animals?.length || 0} )
          </Typography>
          <Box sx={{ backgroundColor: '#FFFFFF', p: 4, borderRadius: '8px', border: '1px solid #C3CEC7' }}>
            {animalDetails?.animals?.length > 0 ? (
              animalDetails?.animals?.map((animal, index) => (
                <Box
                  key={animal.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C3CEC7',
                    borderRadius: '8px',
                    mb: 3
                  }}
                >
               
                  <Avatar
                    sx={{
                      backgroundColor:
                        animal.gender === 'male'
                          ? '#AFEFEB80'
                          : animal.gender === 'female'
                          ? '#FA614026'
                          : animal.gender === 'unknown'
                          ? '#DDEBE9'
                          : '',
                      color:
                        animal.gender === 'male'
                          ? '#00AFD6'
                          : animal.gender === 'female'
                          ? '#FA6140'
                          : animal.gender === 'unknown'
                          ? '#1F515B'
                          : '',
                      fontWeight: '500',
                      marginRight: '16px',
                      fontSize: '14px',
                      width: 40,
                      height: 40,
                      borderRadius: '4px'
                      //ml: 4
                    }}
                  >
                    {animal.gender === 'male' ? 'M' : animal.gender === 'female' ? 'F' : 'U'}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px', mb: 0.5 }}>
                      Species :{' '}
                      <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>
                        {animalDetails?.common_name || 'N/A'}
                      </span>
                    </Typography>

                    <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                      {animal.identifier_type} :
                      <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>
                        {' '}
                        {animal.identifier_value}
                      </span>
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography
                sx={{ background: '#0000000D', p: 12, textAlign: 'center', borderRadius: '8px', fontWeight: '500' }}
              >
                No Animals to show
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AnimalDetailsDrawer)
