import React, { useContext } from 'react'
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Typography,
  CircularProgress,
  IconButton,
  Skeleton,
  Button
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import ClinicalAssessmentListShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentListShimmer'
import { AuthContext } from 'src/context/AuthContext'

export default function SymptomsList({
  symptoms,
  temporarilySelected,
  selectedSymptoms,
  onSelect,
  searchQuery,
  handleSearchChange,
  handleClearSearch,
  handleScroll,
  loading,
  searching,
  isTabsLoading,
  tabOptions,
  currentTab,
  handleTabChange,
  symptomsCount,
  hasMore,
  handleAddNewClick
}) {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const userSettings = authData?.userData?.permission?.user_settings

  return (
    <Box sx={{ pt: 1 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder='Search'
          fullWidth
          size='small'
          sx={{
            flex: 1,
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' sx={{ color: 'gray' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position='end'>
                  <IconButton onClick={handleClearSearch} size='small' sx={{ color: 'gray' }}>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        {userSettings?.medical_add_complaints && (
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
            ADD NEW
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
              ? Array.from(new Array(4)).map((_, index) => (
                  <Skeleton
                    key={index}
                    variant='rounded'
                    width={120}
                    height={40}
                    sx={{ flexShrink: 0, borderRadius: '8px' }}
                  />
                ))
              : tabOptions?.map(tab => (
                  <Box
                    key={tab.id}
                    onClick={() => handleTabChange(tab?.category, tab?.id)}
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
        <Box sx={{ flex: 1 }}>SYMPTOMS</Box>
        <Box sx={{ minWidth: '177px', textAlign: 'left' }}>TYPE</Box>
      </Box>

      <Box sx={{ maxHeight: 500, overflowY: 'auto', mt: 0 }} onScroll={handleScroll}>
        {searching ? (
          <ClinicalAssessmentListShimmer rows={8} />
        ) : symptoms.length === 0 && !loading ? (
          <Box
            sx={{
              background: theme.palette.common.white,
              height: 500,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img src='/images/no_data_animal_2.png' alt='No Symptoms' style={{ maxWidth: '250px' }} />
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '16px' }}>
              No Symptoms to show
            </Typography>
          </Box>
        ) : (
          symptoms.map((symptom, index) => {
            const isSelected = selectedSymptoms.includes(symptom?.id)
            const isTemporarilySelected = temporarilySelected?.id === symptom?.id

            return (
              <Box
                key={symptom?.id}
                sx={{
                  background:
                    isSelected || isTemporarilySelected ? theme.palette.customColors.OnBackground : 'transparent',
                  borderRadius: '1px',
                  px: 1,
                  py: 3.7,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected || isTemporarilySelected}
                      onChange={() => onSelect(symptom)}
                      sx={{
                        transform: 'scale(0.8)',
                        padding: '4px'
                      }}
                    />
                  }
                  label={symptom?.name}
                  sx={{
                    flex: 1,
                    m: 0,
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
                    fontWeight: 400,
                    pl: 4,
                    pr: 2
                  }}
                >
                  {symptom.category_name}
                </Typography>
              </Box>
            )
          })
        )}

        {loading && !searching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!hasMore && !loading && symptoms?.length > 10 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant='body2' color='textSecondary'>
              All symptoms loaded ({symptoms?.length} of {symptomsCount})
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
