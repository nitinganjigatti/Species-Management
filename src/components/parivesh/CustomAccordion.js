// ** MUI Imports
import Accordion from '@mui/material/Accordion'
import Typography from '@mui/material/Typography'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Card, CardContent, Grid } from '@mui/material'
import { useState } from 'react'

// const getStyledAccordion = backgroundImage =>
//   styled(Accordion)(({ theme }) => ({
//     backgroundImage: `url(${backgroundImage})`,
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//     backgroundRepeat: 'no-repeat',
//     color: '#fff',
//     borderRadius: '8px',
//     overflow: 'hidden', // This ensures the border radius is applied properly
//     '& .MuiAccordionSummary-root': {
//       color: '#FFFFFF',
//       backgroundColor: '#00000099', // To ensure text visibility
//       borderTopLeftRadius: '8px',
//       borderTopRightRadius: '8px'
//     },
//     '& .MuiAccordionDetails-root': {
//       backgroundColor: '#00000099', // To ensure text visibility
//       borderBottomLeftRadius: '8px',
//       borderBottomRightRadius: '8px'
//     }
//   }))

const getStyledAccordion = backgroundImage =>
  styled(Accordion)(({ theme }) => ({
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: '#fff',
    borderRadius: '8px',
    overflow: 'hidden', // Ensures border radius is applied properly
    '& .MuiAccordionSummary-root': {
      color: '#FFFFFF',
      backgroundColor: '#00000099', // To ensure text visibility
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      position: 'relative' // Relative positioning for the summary
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      position: 'absolute',
      top: 12,
      right: 18,
      transition: 'transform 0.3s' // Smooth transition for rotation
    },
    '& .MuiAccordionDetails-root': {
      backgroundColor: '#00000099', // To ensure text visibility
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px'
    }
  }))

const CustomAccordion = ({
  title,
  summaryIcon,
  data,
  backgroundImage,
  cards,
  isOrganization,
  organizationName,
  showDetails,
  handleBoxClick
}) => {
  const StyledAccordion = getStyledAccordion(backgroundImage)
  const [expanded, setExpanded] = useState(false)

  const handleChange = () => {
    setExpanded(!expanded)
  }

  return (
    <>
      {isOrganization && (
        <Box
          sx={{
            mb: 3,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: '#00ABAB1A',
            padding: '1rem',
            borderRadius: '0.5rem',
            alignContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => handleBoxClick()}
        >
          <Icon icon='fluent:warning-20-filled' />
          <Typography sx={{ color: '#00AFD6', marginLeft: '0.5rem' }} variant='subtitle2'>
            {organizationName}
          </Typography>
        </Box>
      )}

      <StyledAccordion expanded={expanded} onChange={handleChange}>
        <AccordionSummary
          id='panel-header-1'
          aria-controls='panel-content-1'
          expandIcon={<Icon style={{ color: '#fff' }} icon='mdi:chevron-down' />}
        >
          {showDetails ? (
            <>
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ color: '#fff', display: 'flex', justifyItems: 'center', mb: 3 }}>
                  <Icon style={{ color: '#fff', marginRight: '0.1rem', padding: '3px' }} icon={summaryIcon} /> {title}
                </Typography>
                <Grid container spacing={2}>
                  {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={12 / cards.length} key={index}>
                      <Card sx={{ backgroundColor: '#00000099', border: '1px solid #37BD694D' }}>
                        <CardContent>
                          <Typography variant='h6' component='div' sx={{ color: card?.bgColor }}>
                            {card.value}
                          </Typography>
                          <Typography variant='body2' sx={{ color: '#fff', marginBottom: '0.5rem' }}>
                            {card.content}
                          </Typography>

                          <Grid container spacing={2}>
                            {card.items.map((item, idx) => (
                              <Grid item xs={4} key={idx}>
                                <Typography variant='body2' sx={{ color: '#fff' }}>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      color: '#fff',
                                      display: 'inline-block',
                                      borderRadius: '50%',
                                      width: '10px',
                                      height: '10px',
                                      backgroundColor: item.bgColor,
                                      marginRight: '0.5rem'
                                    }}
                                  ></Typography>
                                  {item?.value}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          ) : (
            <Box>
              <Typography sx={{ color: '#fff', display: 'flex', justifyItems: 'center' }}>
                <Icon style={{ color: '#fff', marginRight: '0.1rem', padding: '3px' }} icon={summaryIcon} /> {title}
              </Typography>
              <Box sx={{ margin: '1rem' }}>
                <Grid container spacing={2} alignItems='center'>
                  {data.map((item, index) => (
                    <Grid item key={index} xs>
                      <Box
                        sx={{
                          borderLeft: index !== 0 ? `2px solid ${item.borderColor}` : 'none',
                          paddingLeft: index !== 0 ? '0.5rem' : 0,
                          paddingRight: index !== 0 ? '1rem' : 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Typography
                          variant='h6'
                          sx={{ color: item.color, fontWeight: index === 0 ? 'bold' : 'normal' }}
                        >
                          {item.value}
                        </Typography>
                        <Typography variant='body2' sx={{ color: index === data.length - 1 ? item.color : '#FFFFFF' }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          )}
        </AccordionSummary>
        <AccordionDetails style={{ paddingTop: '1px', display: 'flex' }}>
          {showDetails ? (
            <>
              <Box sx={{ margin: '1rem' }}>
                <Grid container spacing={2}>
                  {data.map((item, index) => (
                    <Grid item key={index} xs>
                      <Box
                        sx={{
                          borderLeft: index !== 0 ? `2px solid ${item.borderColor}` : 'none',
                          paddingLeft: index !== 0 ? '0.5rem' : 0,
                          paddingRight: index !== 0 ? '1rem' : 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Typography
                          variant='h6'
                          sx={{ color: item.color, fontWeight: index === 0 ? 'bold' : 'normal' }}
                        >
                          {item.value}
                        </Typography>
                        <Typography variant='body2' sx={{ color: index === data.length - 1 ? item.color : '#FFFFFF' }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          ) : (
            <>
              <Grid container spacing={2}>
                {cards.map((card, index) => (
                  <Grid item xs={12} sm={6} md={12 / cards.length} key={index}>
                    <Card sx={{ backgroundColor: '#00000099', border: '1px solid #37BD694D' }}>
                      <CardContent>
                        <Typography variant='h6' component='div' sx={{ color: card?.bgColor }}>
                          {card.value}
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#fff', marginBottom: '0.5rem' }}>
                          {card.content}
                        </Typography>

                        <Grid container spacing={2}>
                          {card.items.map((item, idx) => (
                            <Grid item xs={4} key={idx}>
                              <Typography variant='body2' sx={{ color: '#fff' }}>
                                <Typography
                                  variant='body2'
                                  sx={{
                                    color: '#fff',
                                    display: 'inline-block',
                                    borderRadius: '50%',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: item.bgColor,
                                    marginRight: '0.5rem'
                                  }}
                                ></Typography>
                                {item?.value}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </AccordionDetails>
      </StyledAccordion>
    </>
  )
}

export default CustomAccordion
