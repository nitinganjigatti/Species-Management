'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Drawer, IconButton, Button, useTheme } from '@mui/material'
import { AddCircleOutline } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import Utility from 'src/utility'
import AddNotesFilterDrawer from './AddNotesFilterDrawer'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import SectionsDrawer from '../hospital/inpatient/SectionsDrawer'
import SitesDrawer from '../hospital/inpatient/SitesDrawer'
import EnclosuresDrawer from '../hospital/inpatient/EnclosuresDrawer'
import { Card, CardHeader, CardContent } from '@mui/material'
import SortBottomSheet from '../hospital/inpatient/SortBottomSheet'

const AddAnimalDrawer: React.FC<{
  open: boolean
  onClose: () => void
  handleAnimalSelect: (animals: any, options?: { isSelectAll?: boolean }) => void
  selectedAnimals?: any[]
}> = ({ open, onClose, handleAnimalSelect, selectedAnimals }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  interface SelectionItem {
    site_id?: any
    site_name?: string
    section_id?: any
    section_name?: string
    enclosure_id?: any
    id?: any
    user_enclosure_name?: string
  }

  interface LocalSelections {
    Sites: SelectionItem[]
    Sections: SelectionItem[]
    Enclosures: SelectionItem[]
  }

  const [animalDrawer, setAnimalDrawer] = useState<boolean>(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [isSortBottomSheetOpen, setIsSortBottomSheetOpen] = useState<boolean>(false)

  // Filter and Sort states
  const [selectedOptions, setSelectedOptions] = useState<any>({})
  const [filterCount, setFilterCount] = useState<number>(0)
  const [currentSort, setCurrentSort] = useState<any>({ column: 'animal_id', sort: 'asc' })

  // Hierarchical selection states
  const [localSelections, setLocalSelections] = useState<LocalSelections>({
    Sites: [],
    Sections: [],
    Enclosures: []
  })

  const [openSiteListDrawer, setOpenSiteListDrawer] = useState(false)
  const [openSectionsListDrawer, setOpenSectionsListDrawer] = useState(false)
  const [openEnclosuresListDrawer, setOpenEnclosuresListDrawer] = useState(false)
  const [localAnimals, setLocalAnimals] = useState<any[]>([])

  // Initialize hierarchical and animal state from selectedAnimals when drawer opens
  useEffect(() => {
    if (open && selectedAnimals && selectedAnimals.length > 0) {
      const sites = selectedAnimals
        .filter(a => a.type === 'site')
        .map(a => a.siteData)
        .filter(Boolean)
      const sections = selectedAnimals
        .filter(a => a.type === 'section')
        .map(a => a.sectionData)
        .filter(Boolean)
      const enclosures = selectedAnimals
        .filter(a => a.type === 'enclosure')
        .map(a => a.enclosureData)
        .filter(Boolean)
      const animals = selectedAnimals.filter(a => a.type === 'animal' || !a.type)

      setLocalAnimals(animals)

      if (sites.length > 0 || sections.length > 0 || enclosures.length > 0) {
        setLocalSelections({
          Sites: sites,
          Sections: sections,
          Enclosures: enclosures
        })
      } else {
        setLocalSelections({ Sites: [], Sections: [], Enclosures: [] })
      }
    } else if (open) {
      // Clear selections if drawer is opening with empty/new state
      setLocalSelections({ Sites: [], Sections: [], Enclosures: [] })
      setLocalAnimals([])
    }
  }, [open, selectedAnimals])

  // Handle remove site
  const handleRemoveSite = (siteId: any) => {
    setLocalSelections(prev => ({
      Sites: prev.Sites.filter(site => site.site_id !== siteId),
      Sections: [],
      Enclosures: []
    }))
  }

  // Handle remove section
  const handleRemoveSection = (sectionId: any) => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: prev.Sections.filter(section => section.section_id !== sectionId),
      Enclosures: []
    }))
  }

  // Handle remove enclosure
  const handleRemoveEnclosure = (enclosureId: any) => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: prev.Enclosures.filter(enclosure => enclosure.enclosure_id !== enclosureId)
    }))
  }

  // Handle continue from drawers
  const handleSitesContinue = (selectedData: any) => {
    setLocalSelections({
      Sites: selectedData.selectedSiteData,
      Sections: [],
      Enclosures: []
    })
    setOpenSiteListDrawer(false)
  }

  const handleSectionsContinue = (selectedData: any) => {
    setLocalSelections(prev => ({
      ...prev,
      Sections: selectedData.selectedSectionData
    }))
    setOpenSectionsListDrawer(false)
  }

  const handleEnclosuresContinue = (selectedData: any) => {
    setLocalSelections(prev => ({
      ...prev,
      Enclosures: selectedData.selectedEnclosureData
    }))
    setOpenEnclosuresListDrawer(false)
  }

  const resolveHierarchicalEntities = () => {
    const entities: any[] = []

    if (localSelections.Enclosures.length > 0) {
      localSelections.Enclosures.forEach(enclosure => {
        entities.push({
          type: 'enclosure',
          enclosure_id: enclosure.enclosure_id || enclosure.id,
          user_enclosure_name: enclosure.user_enclosure_name,
          section_id: localSelections.Sections[0]?.section_id,
          site_id: localSelections.Sites[0]?.site_id,
          siteData: localSelections.Sites[0],
          sectionData: localSelections.Sections[0],
          enclosureData: enclosure
        })
      })
    } else if (localSelections.Sections.length > 0) {
      localSelections.Sections.forEach(section => {
        entities.push({
          type: 'section',
          section_id: section.section_id,
          section_name: section.section_name,
          site_id: localSelections.Sites[0]?.site_id,
          siteData: localSelections.Sites[0],
          sectionData: section
        })
      })
    } else if (localSelections.Sites.length > 0) {
      localSelections.Sites.forEach(site => {
        entities.push({
          type: 'site',
          site_id: site.site_id,
          site_name: site.site_name,
          siteData: site
        })
      })
    }
    return entities
  }

  const handleFinalContinue = () => {
    const hierarchyEntities = resolveHierarchicalEntities()
    const finalEntities = [...localAnimals, ...hierarchyEntities]
    handleAnimalSelect(finalEntities)
    onClose()
  }

  // handle apply filters from filter drawer
  const handleApplyFilters = (filters: any) => {
    const updatedOptions = {
      Gender: filters.gender || [],
      'Animal Type': filters.animal_type ? [filters.animal_type] : [],
      'Accession Date': filters.accession_date ? [filters.accession_date] : [],
      type: filters.animal_type || 'single',
      accession_start_date: filters.accession_start_date,
      accession_end_date: filters.accession_end_date
    }
    setSelectedOptions(updatedOptions)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 5,
          py: 4,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          flexShrink: 0
        }}
      >
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          {t('add_animal')}
        </Typography>
        <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>
      <Box sx={{ p: 6, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer'
          }}
          onClick={() => setAnimalDrawer(true)}
        >
          <Typography>{t('select_animal')}</Typography>
          <IconButton size='small' sx={{ color: theme.palette.customColors.Secondary }}>
            <AddCircleOutline />
          </IconButton>
        </Box>

        {/* Site Selection Card */}
        <Card
          sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none', width: '100%' }}
        >
          <CardHeader
            title={t('select_site')}
            onClick={() => {
              if (localSelections.Sections.length === 0 && localSelections.Enclosures.length === 0) {
                setOpenSiteListDrawer(true)
              }
            }}
            sx={{
              background:
                localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0
                  ? theme.palette.customColors.mdAntzNeutral
                  : theme.palette.customColors.displaybgPrimary,
              p: 2,
              pl: 4,
              pr: 2,
              cursor:
                localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0 ? 'default' : 'pointer',
              '.MuiCardHeader-title': {
                fontWeight: '500',
                fontSize: '16px',
                color: theme.palette.customColors.OnPrimaryContainer
              }
            }}
            action={
              <IconButton
                size='small'
                disabled={localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0}
              >
                <Icon
                  fontSize={20}
                  icon={
                    localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0
                      ? 'mdi:lock'
                      : 'mdi:chevron-down'
                  }
                />
              </IconButton>
            }
          />
          {localSelections.Sites.length > 0 && (
            <CardContent sx={{ p: 4 }}>
              {localSelections.Sites.map(site => (
                <Box
                  key={site.site_id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                >
                  <Typography variant='body2'>{site.site_name}</Typography>
                  <IconButton
                    size='small'
                    onClick={() => handleRemoveSite(site.site_id)}
                    disabled={localSelections.Sections.length > 0 || localSelections.Enclosures.length > 0}
                  >
                    <Icon icon='mdi:close-circle-outline' color={theme.palette.error.main} />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Section Selection Card */}
        {localSelections.Sites.length === 1 && (
          <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none' }}>
            <CardHeader
              title={t('select_section')}
              onClick={() => {
                if (localSelections.Enclosures.length === 0) {
                  setOpenSectionsListDrawer(true)
                }
              }}
              sx={{
                background:
                  localSelections.Enclosures.length > 0
                    ? theme.palette.customColors.mdAntzNeutral
                    : theme.palette.customColors.displaybgPrimary,
                p: 2,
                pl: 4,
                cursor: localSelections.Enclosures.length > 0 ? 'default' : 'pointer',
                '.MuiCardHeader-title': {
                  fontWeight: '500',
                  fontSize: '16px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }}
              action={
                <IconButton size='small' disabled={localSelections.Enclosures.length > 0}>
                  <Icon fontSize={20} icon={localSelections.Enclosures.length > 0 ? 'mdi:lock' : 'mdi:chevron-down'} />
                </IconButton>
              }
            />
            {localSelections.Sections.length > 0 && (
              <CardContent sx={{ p: 4 }}>
                {localSelections.Sections.map(section => (
                  <Box
                    key={section.section_id}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                  >
                    <Typography variant='body2'>{section.section_name}</Typography>
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveSection(section.section_id)}
                      disabled={localSelections.Enclosures.length > 0}
                    >
                      <Icon icon='mdi:close-circle-outline' color={theme.palette.error.main} />
                    </IconButton>
                  </Box>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Enclosure Selection Card */}
        {localSelections.Sections.length === 1 && (
          <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none' }}>
            <CardHeader
              title={t('select_enclosure')}
              onClick={() => setOpenEnclosuresListDrawer(true)}
              sx={{
                background: theme.palette.customColors.displaybgPrimary,
                p: 2,
                pl: 4,
                cursor: 'pointer',
                '.MuiCardHeader-title': {
                  fontWeight: '500',
                  fontSize: '16px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }}
              action={
                <IconButton size='small'>
                  <Icon fontSize={20} icon='mdi:chevron-down' />
                </IconButton>
              }
            />
            {localSelections?.Enclosures?.length > 0 && (
              <CardContent sx={{ p: 4 }}>
                {localSelections?.Enclosures?.map(enclosure => (
                  <Box
                    key={enclosure.enclosure_id || enclosure.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                  >
                    <Typography variant='body2'>{enclosure?.user_enclosure_name}</Typography>
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveEnclosure(enclosure?.enclosure_id || enclosure.id)}
                    >
                      <Icon icon='mdi:close-circle-outline' color={theme.palette.error.main} />
                    </IconButton>
                  </Box>
                ))}
              </CardContent>
            )}
          </Card>
        )}
      </Box>

      {/* Footer Submit Button */}
      {localSelections.Sites.length > 0 && (
        <Box
          sx={{
            p: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Button variant='contained' fullWidth onClick={handleFinalContinue} sx={{ py: 3, borderRadius: '8px' }}>
            {t('submit')}
          </Button>
        </Box>
      )}
      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={() => setAnimalDrawer(false)}
          handleAnimalClick={(animals: any, options: any) => {
            const animalList = Array.isArray(animals) ? animals : [animals]
            const mappedAnimals = animalList.map(item => ({
              animal_id: item?.animal_id || item?.id,
              default_common_name: item?.default_common_name || item?.common_name,
              scientific_name: item?.scientific_name ?? item?.complete_name,
              user_enclosure_name: item?.user_enclosure_name || item?.enclosure_name,
              section_name: item?.section_name,
              site_name: item?.site_name,
              type: 'animal',
              sex: item?.sex || item?.gender,
              default_icon: item?.default_icon || item?.animal_image || item?.image,
              total_animal: item?.total_animal,
              local_identifier_name: item?.local_identifier_name,
              local_identifier_value: item?.local_identifier_value,
              enclosure_id: item?.enclosure_id || item?.id,
              section_id: item?.section_id || item?.id,
              site_id: item?.site_id || item?.id
            }))

            const hierarchyEntities = resolveHierarchicalEntities()
            const finalEntities = [...mappedAnimals, ...hierarchyEntities]
            handleAnimalSelect(finalEntities)
            onClose()
          }}
          btnText={t('add') as string}
          showFilterAndSort
          handleFilterClick={() => setOpenFilterDrawer(true)}
          handleSortClick={() => setIsSortBottomSheetOpen(true)}
          filters={selectedOptions}
          sortType={currentSort}
          filterCount={filterCount}
          multiSelect={true}
          customQueryParams={
            (({ activeTab, filters: drawerFilters, sortType: drawerSort }: any) => ({
              list_type: activeTab,
              gender: drawerFilters?.Gender || [],
              accession_start_date:
                drawerFilters?.accession_start_date && Utility.formatDate(drawerFilters?.accession_start_date),
              accession_end_date:
                drawerFilters?.accession_end_date && Utility.formatDate(drawerFilters?.accession_end_date),
              type: drawerFilters?.type || 'single',
              sort: drawerSort?.sort || 'asc',
              column: drawerSort?.column || 'animal_id',
              zoo_id: zooId
            })) as any
          }
        />
      )}

      {openSiteListDrawer && (
        <SitesDrawer
          open={openSiteListDrawer}
          onClose={() => setOpenSiteListDrawer(false)}
          localSelections={localSelections.Sites}
          onContinue={handleSitesContinue}
          data={{ queryKey: 'hospital-sites', params: {} }}
        />
      )}

      {openSectionsListDrawer && (
        <SectionsDrawer
          open={openSectionsListDrawer}
          onClose={() => setOpenSectionsListDrawer(false)}
          localSelections={localSelections.Sections}
          onContinue={handleSectionsContinue}
          data={{
            id: localSelections.Sites[0]?.site_id,
            name: localSelections.Sites[0]?.site_name,
            queryKey: 'hospital-sections',
            params: { site_id: localSelections.Sites[0]?.site_id, list_all_sections: true }
          }}
        />
      )}

      {openEnclosuresListDrawer && (
        <EnclosuresDrawer
          open={openEnclosuresListDrawer}
          onClose={() => setOpenEnclosuresListDrawer(false)}
          localSelections={localSelections.Enclosures}
          onContinue={handleEnclosuresContinue}
          data={{
            id: localSelections.Sections[0]?.section_id,
            name: localSelections.Sections[0]?.section_name,
            queryKey: 'hospital-enclosures',
            params: { section_id: localSelections.Sections[0]?.section_id, filter_user_enclosure: 0 }
          }}
        />
      )}

      {openFilterDrawer && (
        <AddNotesFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onSubmitLoading={false}
          onApplyFilters={handleApplyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
        />
      )}

      {isSortBottomSheetOpen && (
        <SortBottomSheet
          open={isSortBottomSheetOpen}
          onClose={() => setIsSortBottomSheetOpen(false)}
          currentSort={currentSort.sort === 'asc' ? 'recent' : 'oldest'}
          onSortChange={(sortObj: any) => setCurrentSort(sortObj)}
        />
      )}
    </Drawer>
  )
}

export default AddAnimalDrawer
