import { useTheme } from '@emotion/react'
import { Card, CardContent, CardHeader, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import SectionsDrawer from './SectionsDrawer'
import SitesDrawer from './SitesDrawer'
import EnclosuresDrawer from './EnclosuresDrawer'
import { useAuth } from 'src/hooks/useAuth'

const AddPatientSiteFilter = ({ localSelections, setLocalSelections }) => {
  const theme = useTheme()
  const auth = useAuth()

  const [collapsed] = useState(true)
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)
  const [openSectionsListDrawer, setOpenSectionsListDrawer] = useState(false)
  const [openEnclosuresListDrawer, setOpenEnclosuresListDrawer] = useState(false)

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const handleRemoveSite = siteId => {
    setLocalSelections(prev => ({
      Sites: prev.Sites.filter(site => site.site_id !== siteId),
      Sections: [],
      Enclosures: []
    }))
  }

  const handleRemoveSection = sectionId => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: prev.Sections.filter(section => section.section_id !== sectionId),
      Enclosures: []
    }))
  }

  const handleRemoveEnclosure = enclosureId => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: prev.Enclosures.filter(enclosure => enclosure.enclosure_id !== enclosureId)
    }))
  }

  // Handle continue from sections drawer
  const handleSectionsContinue = selectedData => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: selectedData.selectedSectionData
    }))
    setOpenSectionsListDrawer(false)
  }

  // Handle continue from sites drawer
  const handleSitesContinue = selectedData => {
    console.log('selectedData', selectedData)
    setLocalSelections({
      Sites: selectedData.selectedSiteData,
      Sections: [],
      Enclosures: []
    })
    setSiteListDrawer(false)
  }

  // Handle continue from enclosures drawer
  const handleEnclosuresContinue = selectedData => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: selectedData.selectedEnclosureData
    }))
    setOpenEnclosuresListDrawer(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Card sx={{ border: '1px solid #C3CEC7', boxShadow: 'none', width: '100%' }}>
        <CardHeader
          title='Select Site'
          onClick={() => {
            if (localSelections?.Sections?.length === 0 && localSelections?.Enclosures?.length === 0) {
              setSiteListDrawer(true)
            }
          }}
          disabled={localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0}
          sx={{
            background:
              localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0 ? '#0000000D' : '#E8F4F2',
            p: 2,
            pl: 4,
            pr: 2,
            '.MuiCardHeader-title': {
              fontWeight: '500',
              fontSize: '16px',
              color:
                localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0 ? '#44544A' : '#1F515B',
              cursor: localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0 ? '' : 'pointer'
            }
          }}
          action={
            <IconButton
              size='small'
              aria-label='collapse'
              sx={{ color: '#44544A' }}
              disabled={localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0}
            >
              <Icon
                fontSize={20}
                icon={
                  localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0
                    ? 'mdi:lock'
                    : 'mdi:chevron-down'
                }
              />
            </IconButton>
          }
        />
        {localSelections?.Sites?.length > 0 && (
          <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
            {localSelections.Sites.map(site => (
              <Box
                key={site.site_id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant='body2' sx={{ color: '#000000' }}>
                  {site.site_name}
                </Typography>
                <IconButton
                  edge='end'
                  onClick={() => handleRemoveSite(site.site_id)}
                  sx={{ color: theme.palette.error.dark }}
                  disabled={localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0}
                >
                  <Icon icon='carbon:close-outline' fontSize={20} />
                </IconButton>
              </Box>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Section Selection Card - Only show when exactly ONE site is selected */}
      {localSelections?.Sites?.length === 1 && (
        <Card sx={{ border: '1px solid #C3CEC7', boxShadow: 'none', mt: '6%' }}>
          <CardHeader
            title='Select Section'
            onClick={() => setOpenSectionsListDrawer(true)}
            sx={{
              background: localSelections.Enclosures.length > 0 ? '#0000000D' : '#E8F4F2',
              p: 2,
              pl: 4,
              pr: 2,
              '.MuiCardHeader-title': {
                fontWeight: '500',
                fontSize: '16px',
                color: localSelections.Enclosures.length > 0 ? '#44544A' : '#1F515B',
                cursor: localSelections.Enclosures.length > 0 ? '' : 'pointer'
              }
            }}
            action={
              <IconButton
                size='small'
                aria-label='collapse'
                sx={{ color: '#44544A' }}
                disabled={localSelections.Enclosures.length > 0}
              >
                <Icon fontSize={20} icon={localSelections.Enclosures.length > 0 ? 'mdi:lock' : 'mdi:chevron-down'} />
              </IconButton>
            }
          />
          {localSelections?.Sections?.length > 0 && (
            <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
              {localSelections.Sections.map(section => (
                <Box
                  key={section.section_id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant='body2' sx={{ color: '#000000' }}>
                    {section.section_name}
                  </Typography>
                  <IconButton
                    edge='end'
                    onClick={() => handleRemoveSection(section.section_id)}
                    sx={{ color: theme.palette.error.dark }}
                    disabled={localSelections.Enclosures.length > 0}
                  >
                    <Icon icon='carbon:close-outline' fontSize={20} />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Enclosure Selection Card - Only show when exactly ONE section is selected */}
      {localSelections?.Sites?.length === 1 && localSelections?.Sections?.length === 1 && (
        <Card sx={{ border: '1px solid #C3CEC7', boxShadow: 'none', mt: '6%' }}>
          <CardHeader
            title='Select Enclosure'
            onClick={() => setOpenEnclosuresListDrawer(true)}
            sx={{
              background: '#E8F4F2',
              p: 2,
              pl: 4,
              pr: 2,
              '.MuiCardHeader-title': {
                fontWeight: '500',
                fontSize: '16px',
                color: '#1F515B',
                cursor: 'pointer'
              }
            }}
            action={
              <IconButton size='small' aria-label='collapse' sx={{ color: '#44544A' }}>
                <Icon fontSize={20} icon='mdi:chevron-down' />
              </IconButton>
            }
          />
          {localSelections.Enclosures.length > 0 && (
            <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
              {localSelections.Enclosures.map(enclosure => (
                <Box
                  key={enclosure.enclosure_id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant='body2' sx={{ color: '#000000' }}>
                    {enclosure.user_enclosure_name}
                  </Typography>
                  <IconButton
                    edge='end'
                    onClick={() => handleRemoveEnclosure(enclosure.enclosure_id || enclosure.id)}
                    sx={{ color: theme.palette.error.dark }}
                  >
                    <Icon icon='carbon:close-outline' fontSize={20} />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Footer with Apply Button */}
      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          display: 'flex',
          gap: 2,
          width: '100%',
        }}
      >
      </Box>

      {openSiteListDrawer && (
        <SitesDrawer
          onClose={() => setSiteListDrawer(false)}
          localSelections={localSelections.Sites}
          open={openSiteListDrawer}
          onContinue={handleSitesContinue}
          data={{
            queryKey: 'hospital-sites',
            params: {}
          }}
        />
      )}

      {openSectionsListDrawer && (
        <SectionsDrawer
          onClose={() => setOpenSectionsListDrawer(false)}
          localSelections={localSelections.Sections}
          open={openSectionsListDrawer}
          onContinue={handleSectionsContinue}
          data={{
            id: localSelections.Sites[0]?.site_id,
            name: localSelections.Sites[0]?.site_name,
            image: localSelections.Sites[0]?.site_image,
            queryKey: 'hospital-sections',
            params: {
              site_id: localSelections.Sites[0]?.site_id
            }
          }}
        />
      )}

      {openEnclosuresListDrawer && (
        <EnclosuresDrawer
          onClose={() => setOpenEnclosuresListDrawer(false)}
          localSelections={localSelections.Enclosures}
          open={openEnclosuresListDrawer}
          onContinue={handleEnclosuresContinue}
          data={{
            id: localSelections.Sections[0]?.section_id,
            name: localSelections.Sections[0]?.section_name,
            image: localSelections.Sections[0]?.images?.[0]?.file,
            queryKey: 'hospital-enclosures',
            params: {
              ref_type: 'zoo',
              data_type: 'enclosure',
              ref_id: zooId,
              site_id: localSelections.Sites[0]?.site_id,
              section_id: localSelections.Sections[0]?.section_id
            }
          }}
        />
      )}
    </Box>
  )
}

export default AddPatientSiteFilter
