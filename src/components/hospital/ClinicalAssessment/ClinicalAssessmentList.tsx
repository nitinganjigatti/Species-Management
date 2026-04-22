'use client'

import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  Button
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import ClinicalAssessmentListShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentListShimmer'
import { AuthContext } from 'src/context/AuthContext'
import Search from 'src/views/utility/Search'
import MUICheckboxRaw from 'src/views/forms/form-fields/MUICheckbox'
const MUICheckbox: any = MUICheckboxRaw

interface ClinicalAssessmentListProps {
  symptoms?: any[]
  temporarilySelected?: any
  selectedSymptoms?: any[]
  onSelect?: (s: any) => void
  handleTabChange?: (category: any, id: any) => void
  currentTab?: any
  isTabsLoading?: boolean
  isInitialLoading?: boolean
  tabOptions?: any[]
  searchTerm?: string
  setSearchTerm?: (v: string) => void
  hasMore?: boolean
  totalCount?: number
  isLoading?: boolean
  loadMoreTriggerRef?: any
  handleAddNewClick?: () => void
  alreadySelectedIds?: any[]
}

export default function ClinicalAssessmentList({
  symptoms = [],
  temporarilySelected,
  selectedSymptoms = [],
  onSelect,
  handleTabChange,
  currentTab,
  isTabsLoading,
  isInitialLoading,
  tabOptions,
  searchTerm,
  setSearchTerm,
  hasMore,
  totalCount,
  isLoading,
  loadMoreTriggerRef,
  handleAddNewClick,
  alreadySelectedIds = []
}: ClinicalAssessmentListProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()

  const authData: any = useContext(AuthContext)
  const userSettings = authData?.userData?.permission?.user_settings

  const filteredSymptoms = symptoms
  const listHeight = 620

  return (
    <Box sx={{ pt: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <Search
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm && setSearchTerm(e.target.value)}
          width={'100%'}
          sx={{
            flex: 1,
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
          onClear={() => {
            setSearchTerm && setSearchTerm('')
          }}
        />

        {userSettings?.medical_add_diagnosis && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAddNewClick}
            sx={{
              height: '40px',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              px: 3
            }}
          >
            {t('hospital_module.add_new')}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent',
            columnGap: 4
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
            {isTabsLoading
              ? Array.from(new Array(4)).map((_, index: number) => (
                  <Skeleton
                    key={index}
                    variant='rounded'
                    width={120}
                    height={40}
                    sx={{ flexShrink: 0, borderRadius: '8px' }}
                  />
                ))
              : tabOptions?.map((tab: any) => (
                  <Box
                    key={tab.id}
                    onClick={() => handleTabChange && handleTabChange(tab?.category, tab?.id)}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: '16px',
                      py: '8px',
                      borderRadius: '8px',
                      backgroundColor:
                        currentTab === tab?.category
                          ? theme.palette.secondary.dark
                          : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer'
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          currentTab === tab?.category
                            ? theme.palette.primary.contrastText
                            : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {`${tab?.category} - ${tab?.child_count}`}
                    </Typography>
                  </Box>
                ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          color: theme.palette.customColors.deepDark,
          fontSize: '12px',
          fontWeight: 600,
          p: 3.7,
          borderRadius: '4px',
          mt: 3,
          background: theme.palette.customColors.mdAntzNeutral,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box sx={{ flex: 1 }}>{t('hospital_module.clinical_assessment_header')}</Box>
        <Box sx={{ minWidth: '192px', textAlign: 'left' }}>{t('hospital_module.type_header')}</Box>
      </Box>

      <Box sx={{ maxHeight: listHeight, overflowY: 'auto', mt: 0 }}>
        {isTabsLoading || isInitialLoading ? (
          <ClinicalAssessmentListShimmer rows={8} />
        ) : filteredSymptoms.length === 0 ? (
          <Box
            sx={{
              background: theme.palette.common.white,
              height: listHeight,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img src='/images/no_data_animal_2.png' alt='No Symptoms' style={{ maxWidth: '250px' }} />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
              {t('hospital_module.no_clinical_assessment_to_show')}
            </Typography>
          </Box>
        ) : (
          <>
            {filteredSymptoms.map((symptom: any, index: number) => {
              const isSelected = selectedSymptoms.includes(symptom.id)
              const isTemporarilySelected = temporarilySelected?.id === symptom.id
              const isAlreadyPrescribed = alreadySelectedIds?.includes(symptom.id)

              return (
                <Box
                  key={symptom.id || index}
                  sx={{
                    background:
                      isSelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
                    borderRadius: '1px',
                    px: 1,
                    py: 3.7,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    justifyContent: 'space-between'
                  }}
                >
                  <MUICheckbox
                    label={symptom.name}
                    checked={isSelected || isTemporarilySelected || isAlreadyPrescribed}
                    disabled={isAlreadyPrescribed}
                    onChange={() => onSelect && onSelect(symptom)}
                    checkboxStyle={{
                      transform: 'scale(0.8)',
                      padding: '4px'
                    }}
                    formControlLabelStyle={{
                      '& .MuiFormControlLabel-label': {
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '16px',
                        fontWeight: 600
                      }
                    }}
                  />
                  <Typography
                    sx={{
                      width: '200px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                  >
                    {symptom.category_name}
                  </Typography>
                </Box>
              )
            })}

            {/* Infinite scroll trigger element - shows loader when loading more pages */}
            {(hasMore || isLoading) && (
              <Box
                ref={loadMoreTriggerRef}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 3,
                  minHeight: '60px'
                }}
              >
                {isLoading && <CircularProgress size={24} />}
              </Box>
            )}

            {/* End message when all items loaded */}
            {!hasMore && !isLoading && symptoms?.length > 10 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant='body2' color='textSecondary'>
                  All assessments loaded ({symptoms?.length} of {totalCount})
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
