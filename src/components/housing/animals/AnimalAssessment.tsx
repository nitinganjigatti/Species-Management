import React, { useState, useMemo, useEffect } from 'react'
import { Box, Typography, CircularProgress, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import Icon from 'src/@core/components/icon'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import {
  AssessmentCategoryChips,
  AssessmentCard,
  AddEditAssessmentDrawer,
  AssessmentSummaryDrawer,
  AddAssessmentTypeDrawer
} from './assessment'
import { getAssessmentAnimalTypes, getMeasurementUnits } from 'src/lib/api/assessment'
import type {
  AssessmentType,
  AssessmentValue,
  AssessmentCategory,
  MeasurementUnit,
  GetAssessmentTypesResponse,
  GetMeasurementUnitsResponse
} from 'src/types/housing/assessment'

interface AnimalAssessmentProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  animalDetails?: {
    // Support both naming conventions
    animal_id?: number
    aid?: number
    is_alive?: boolean | string
    isAlive?: string
    type?: string
    animal_status?: string
    birth_date?: string
    birthDate?: string
  }
  enclosureDetails?: any
}

const AnimalAssessment: React.FC<AnimalAssessmentProps> = ({
  selectedTab,
  setSelectedTab,
  animalDetails,
  enclosureDetails
}) => {
  const theme = useTheme()
  const auth = useAuth() as any
  const userData = auth?.userData

  // State
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [categories, setCategories] = useState<AssessmentCategory[]>([])
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([])

  // Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Add/Edit Drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType | null>(null)
  const [selectedValue, setSelectedValue] = useState<AssessmentValue | null>(null)
  const [fromAddIcon, setFromAddIcon] = useState<boolean>(false)

  // Summary Drawer
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState<boolean>(false)
  const [summaryInitialTypeId, setSummaryInitialTypeId] = useState<string | undefined>(undefined)

  // Add Assessment Type Drawer
  const [addTypeDrawerOpen, setAddTypeDrawerOpen] = useState<boolean>(false)

  // Support both naming conventions for animal ID
  const animalId = animalDetails?.animal_id || animalDetails?.aid

  // Fetch assessment types
  const {
    data: assessmentData,
    isLoading: isAssessmentLoading,
    refetch: refetchAssessments
  } = useQuery<GetAssessmentTypesResponse>({
    queryKey: ['animal-assessment-types', animalId],
    queryFn: () => getAssessmentAnimalTypes(animalId!),
    enabled: !!animalId
  })

  // Fetch measurement units
  const { data: unitData } = useQuery<GetMeasurementUnitsResponse>({
    queryKey: ['measurement-units'],
    queryFn: getMeasurementUnits,
    staleTime: Infinity // Units rarely change
  })

  // Process assessment data
  useEffect(() => {
    if (!assessmentData?.success) return

    const assessments = assessmentData.data || []
    setAssessmentTypes(assessments)

    // Extract unique categories
    const categoryMap = new Map<string, { name: string; stringId?: string }>()
    assessments.forEach(a => {
      if (!categoryMap.has(a.assessment_category_id)) {
        categoryMap.set(a.assessment_category_id, {
          name: a.assessment_category_name,
          stringId: a.assessment_category_string_id
        })
      }
    })

    const categoryList: AssessmentCategory[] = [{ id: 'All', name: 'All', isSelected: true }]

    categoryMap.forEach((value, key) => {
      categoryList.push({
        id: key,
        name: value.name,
        stringId: value.stringId,
        isSelected: false
      })
    })

    setCategories(categoryList)
  }, [assessmentData])

  // Process measurement units
  useEffect(() => {
    if (unitData?.success && unitData.data) {
      setMeasurementUnits(unitData.data)
    }
  }, [unitData])

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    let result = assessmentTypes

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(a => a.assessment_category_id === selectedCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(a => a.assessment_name.toLowerCase().includes(query))
    }

    return result
  }, [assessmentTypes, selectedCategory, searchQuery])

  // Permission checks
  const canAddAssessment = useMemo(() => {
    if (!animalDetails) return false

    // Check if animal is alive - handle boolean, string, and number formats
    const isAliveValue = animalDetails.is_alive ?? animalDetails.isAlive
    const isAlive = isAliveValue === true || isAliveValue === '1' || String(isAliveValue) === '1'

    // Check if animal is single or group type
    const isValidType = animalDetails.type === 'single' || animalDetails.type === 'group'

    return isAlive && isValidType
  }, [animalDetails])

  // Check if animal is alive for the drawer (to determine edit/view mode)
  const isAnimalAlive = useMemo(() => {
    const isAliveValue = animalDetails?.is_alive ?? animalDetails?.isAlive

    return isAliveValue === true || isAliveValue === '1' || String(isAliveValue) === '1'
  }, [animalDetails])

  const isAnimalOnHold = animalDetails?.animal_status === 'ON_HOLD'

  // Handlers
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  const handleAddClick = (assessment: AssessmentType) => {
    if (isAnimalOnHold) {
      Toaster({
        type: 'warning',
        message: 'This animal is currently on hold. Please check back later.'
      })

      return
    }

    setSelectedAssessmentType(assessment)
    setSelectedValue(null)
    setFromAddIcon(true)
    setDrawerOpen(true)
  }

  const handleValueClick = (assessment: AssessmentType, value: AssessmentValue, _index: number) => {
    setSelectedAssessmentType(assessment)
    setSelectedValue(value)
    setFromAddIcon(false)
    setDrawerOpen(true)
  }

  const handleHeaderClick = (assessment: AssessmentType) => {
    // Open assessment summary drawer
    setSummaryInitialTypeId(assessment.assessment_type_id)
    setSummaryDrawerOpen(true)
  }

  // Handlers for summary drawer callbacks
  const handleSummaryAddClick = (assessment: AssessmentType) => {
    setSummaryDrawerOpen(false)
    handleAddClick(assessment)
  }

  const handleSummaryEditClick = (assessment: AssessmentType, value: AssessmentValue) => {
    setSummaryDrawerOpen(false)
    setSelectedAssessmentType(assessment)
    setSelectedValue(value)
    setFromAddIcon(false)
    setDrawerOpen(true)
  }

  const handleSummaryViewClick = (assessment: AssessmentType, value: AssessmentValue) => {
    setSummaryDrawerOpen(false)
    setSelectedAssessmentType(assessment)
    setSelectedValue(value)
    setFromAddIcon(false)
    setDrawerOpen(true)
  }

  const handleRefetch = () => {
    refetchAssessments()
  }

  // Get existing type IDs (for Add Assessment Type drawer)
  const existingTypeIds = useMemo(() => {
    return assessmentTypes.map(a => a.assessment_type_id)
  }, [assessmentTypes])

  // Handle Add Assessment Type success
  const handleAddTypeSuccess = () => {
    refetchAssessments()
  }

  // Loading state
  if (isAssessmentLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2
        }}
      >
        {/* Left: Search */}
        <Search
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder='Search assessments...'
          width={250}
        />

        {/* Right: Add Button */}
        {canAddAssessment && (
          <Button
            variant='contained'
            size='small'
            onClick={() => setAddTypeDrawerOpen(true)}
            startIcon={<Icon icon='mdi:plus' fontSize={18} />}
            sx={{
              borderRadius: '8px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              minHeight: '40px'
            }}
          >
            Add Assessment
          </Button>
        )}
      </Box>

      {/* Category Chips */}
      {categories.length > 1 && (
        <Box sx={{ mb: 4 }}>
          <AssessmentCategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </Box>
      )}

      {/* Assessment Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {filteredAssessments.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary'
            }}
          >
            <Icon icon='mdi:clipboard-text-off-outline' fontSize={48} />
            <Typography variant='body1' sx={{ mt: 2 }}>
              {searchQuery ? 'No assessments found matching your search' : 'No assessments available'}
            </Typography>
          </Box>
        ) : (
          filteredAssessments.map(assessment => (
            <AssessmentCard
              key={assessment.assessment_type_id}
              assessment={assessment}
              measurementUnits={measurementUnits}
              canAdd={canAddAssessment}
              onAddClick={handleAddClick}
              onValueClick={handleValueClick}
              onHeaderClick={handleHeaderClick}
            />
          ))
        )}
      </Box>

      {/* Add/Edit Drawer */}
      <AddEditAssessmentDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        assessment={selectedAssessmentType}
        selectedValue={selectedValue}
        animalId={animalId || ''}
        measurementUnits={measurementUnits}
        userId={userData?.user_id || 0}
        isAnimalAlive={isAnimalAlive}
        fromAddIcon={fromAddIcon}
        refetch={handleRefetch}
      />

      {/* Assessment Summary Drawer */}
      <AssessmentSummaryDrawer
        open={summaryDrawerOpen}
        onClose={() => setSummaryDrawerOpen(false)}
        assessmentTypes={assessmentTypes}
        initialAssessmentTypeId={summaryInitialTypeId}
        animalId={animalId || ''}
        measurementUnits={measurementUnits}
        userId={userData?.user_id || 0}
        canAdd={canAddAssessment}
        onAddClick={handleSummaryAddClick}
        onEditClick={handleSummaryEditClick}
        onViewClick={handleSummaryViewClick}
      />

      {/* Add Assessment Type Drawer */}
      <AddAssessmentTypeDrawer
        open={addTypeDrawerOpen}
        onClose={() => setAddTypeDrawerOpen(false)}
        animalId={animalId || ''}
        existingTypeIds={existingTypeIds}
        onSuccess={handleAddTypeSuccess}
      />
    </Box>
  )
}

export default AnimalAssessment
