import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, IconButton, Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import SitesDrawer from 'src/components/hospital/inpatient/SitesDrawer'
import SectionsDrawer from 'src/components/hospital/inpatient/SectionsDrawer'
import EnclosuresDrawer from 'src/components/hospital/inpatient/EnclosuresDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { getSectionsList, getEnclosureList } from 'src/lib/api/diet/dietList'

interface SiteData {
  site_id: number
  site_name: string
  site_image?: string
}

interface SectionData {
  section_id: number
  section_name: string
  images?: { file: string }[]
}

interface EnclosureData {
  enclosure_id: number
  user_enclosure_name: string
  id?: number
}

export interface LocalSelections {
  Sites: SiteData[]
  Sections: SectionData[]
  Enclosures: EnclosureData[]
}

interface LineageEntityFilterProps {
  localSelections: LocalSelections
  setLocalSelections: React.Dispatch<React.SetStateAction<LocalSelections>>
}

const LineageEntityFilter: React.FC<LineageEntityFilterProps> = ({ localSelections, setLocalSelections }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [openSiteListDrawer, setSiteListDrawer] = useState(false)
  const [openSectionsListDrawer, setOpenSectionsListDrawer] = useState(false)
  const [openEnclosuresListDrawer, setOpenEnclosuresListDrawer] = useState(false)

  const handleRemoveSite = (siteId: number) => {
    setLocalSelections(prev => ({
      Sites: prev.Sites.filter(site => site.site_id !== siteId),
      Sections: [],
      Enclosures: []
    }))
  }

  const handleRemoveSection = (sectionId: number) => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: prev.Sections.filter(section => section.section_id !== sectionId),
      Enclosures: []
    }))
  }

  const handleRemoveEnclosure = (enclosureId: number) => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: prev.Enclosures.filter(enclosure => enclosure.enclosure_id !== enclosureId)
    }))
  }

  const handleSitesContinue = (selectedData: { selectedSiteData: SiteData[] }) => {
    setLocalSelections({
      Sites: selectedData.selectedSiteData,
      Sections: [],
      Enclosures: []
    })
    setSiteListDrawer(false)
  }

  const handleSectionsContinue = (selectedData: { selectedSectionData: SectionData[] }) => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: selectedData.selectedSectionData
    }))
    setOpenSectionsListDrawer(false)
  }

  const handleEnclosuresContinue = (selectedData: { selectedEnclosureData: EnclosureData[] }) => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: selectedData.selectedEnclosureData
    }))
    setOpenEnclosuresListDrawer(false)
  }

  const isSiteDisabled = localSelections?.Sections?.length > 0 || localSelections?.Enclosures?.length > 0
  const isSectionDisabled = localSelections?.Enclosures?.length > 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Site Selection Card */}
      <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none', width: '100%' }}>
        <CardHeader
          title={t('housing_module.select_site')}
          onClick={() => {
            if (!isSiteDisabled) {
              setSiteListDrawer(true)
            }
          }}
          sx={{
            background: isSiteDisabled
              ? theme.palette.customColors.neutral05
              : theme.palette.customColors.displaybgPrimary,
            p: 2,
            pl: 4,
            pr: 2,
            '.MuiCardHeader-title': {
              fontWeight: '500',
              fontSize: '16px',
              color: isSiteDisabled
                ? theme.palette.customColors.OnSurfaceVariant
                : theme.palette.customColors.OnPrimaryContainer,
              cursor: isSiteDisabled ? 'default' : 'pointer'
            }
          }}
          action={
            <IconButton
              size='small'
              aria-label='collapse'
              sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
              disabled={isSiteDisabled}
            >
              <Icon fontSize={20} icon={isSiteDisabled ? 'mdi:lock' : 'mdi:chevron-down'} />
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
                <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralPrimary }}>
                  {site.site_name}
                </Typography>
                <IconButton
                  edge='end'
                  onClick={() => handleRemoveSite(site.site_id)}
                  sx={{ color: theme.palette.error.dark }}
                  disabled={isSiteDisabled}
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
        <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none', mt: '6%' }}>
          <CardHeader
            title={t('housing_module.select_section')}
            onClick={() => {
              if (!isSectionDisabled) {
                setOpenSectionsListDrawer(true)
              }
            }}
            sx={{
              background: isSectionDisabled
                ? theme.palette.customColors.neutral05
                : theme.palette.customColors.displaybgPrimary,
              p: 2,
              pl: 4,
              pr: 2,
              '.MuiCardHeader-title': {
                fontWeight: '500',
                fontSize: '16px',
                color: isSectionDisabled
                  ? theme.palette.customColors.OnSurfaceVariant
                  : theme.palette.customColors.OnPrimaryContainer,
                cursor: isSectionDisabled ? 'default' : 'pointer'
              }
            }}
            action={
              <IconButton
                size='small'
                aria-label='collapse'
                sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                disabled={isSectionDisabled}
              >
                <Icon fontSize={20} icon={isSectionDisabled ? 'mdi:lock' : 'mdi:chevron-down'} />
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
                  <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralPrimary }}>
                    {section.section_name}
                  </Typography>
                  <IconButton
                    edge='end'
                    onClick={() => handleRemoveSection(section.section_id)}
                    sx={{ color: theme.palette.error.dark }}
                    disabled={isSectionDisabled}
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
        <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none', mt: '6%' }}>
          <CardHeader
            title={t('housing_module.select_enclosure')}
            onClick={() => setOpenEnclosuresListDrawer(true)}
            sx={{
              background: theme.palette.customColors.displaybgPrimary,
              p: 2,
              pl: 4,
              pr: 2,
              '.MuiCardHeader-title': {
                fontWeight: '500',
                fontSize: '16px',
                color: theme.palette.customColors.OnPrimaryContainer,
                cursor: 'pointer'
              }
            }}
            action={
              <IconButton size='small' aria-label='collapse' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                <Icon fontSize={20} icon='mdi:chevron-down' />
              </IconButton>
            }
          />
          {localSelections?.Enclosures?.length > 0 && (
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
                  <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralPrimary }}>
                    {enclosure.user_enclosure_name}
                  </Typography>
                  <IconButton
                    edge='end'
                    onClick={() => handleRemoveEnclosure(enclosure.enclosure_id || enclosure.id || 0)}
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

      {/* Drawers */}
      {openSiteListDrawer && (
        <SitesDrawer
          onClose={() => setSiteListDrawer(false)}
          localSelections={localSelections.Sites}
          open={openSiteListDrawer}
          onContinue={handleSitesContinue}
          data={{
            queryKey: 'lineage-sites',
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
            queryKey: 'lineage-sections',
            params: {
              site_id: localSelections.Sites[0]?.site_id,
              list_all_sections: true
            }
          }}
          //TODO: Add these parameters
          // showCount={true}
          // fetchFn={getSectionsList}
          // fetchParams={{
          //   zoo_id: zooId,
          //   site_id: localSelections.Sites[0]?.site_id,
          //   ignore_sys_gen: 1,
          //   other: 'include_all',
          //   module: 'Observation'
          // }}
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
            queryKey: 'lineage-enclosures',
            params: {
              section_id: localSelections.Sections[0]?.section_id,
              filter_user_enclosure: 0
            }
          }}
          //TODO: Add these parameters
          // showCount={true}
          // fetchFn={getEnclosureList}
          // fetchParams={{
          //   section_id: localSelections.Sections[0]?.section_id,
          //   other: 'include_all',
          //   module: 'Observation'
          // }}
        />
      )}
    </Box>
  )
}

export default LineageEntityFilter
