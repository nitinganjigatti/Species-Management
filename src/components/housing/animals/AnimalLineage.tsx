import React, { useState, useEffect, FC, useMemo, useCallback, useRef, useContext } from 'react'
import { Box, Typography, IconButton, CircularProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Add as AddIcon,
  Close as CloseIcon,
  AddCircleOutline as AddCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

import {
  getLineageParents,
  getLineagePairs,
  getLineageSiblings,
  deleteLineageParent,
  deleteLineagePair
} from 'src/lib/api/housing'
import type {
  LineageAnimal,
  ExternalAnimal,
  LineageParentData,
  LineagePair,
  LineageSibling,
  DeleteParentPayload,
  DeletePairPayload
} from 'src/types/housing'
import NoDataFound from 'src/views/utility/NoDataFound'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { AuthContext } from 'src/context/AuthContext'
import { AddParentDrawer, AddPairDrawer, ExternalAnimalDetailsDialog } from './lineage'
import ParentListDrawer from './lineage/ParentListDrawer'
import AnimalCard from 'src/views/utility/AnimalCard'

interface AnimalLineageProps {
  animalDetails?: {
    sex?: string
    type?: string
    isAlive?: string
    taxonomy_id?: number | string
    reproduction_type?: string
    is_egg_animal?: boolean
  }
}

type LineageTabType = 'Parents' | 'Pairs' | 'Siblings'

interface ParentSection {
  key: string
  data: (LineageAnimal | ExternalAnimal)[]
  parentType: 'Dam' | 'Sire'
  isConfirmed: boolean
  isExternal: boolean
  totalCount: number
}

interface PairPageResult {
  result: LineagePair[]
  nextPage: number | undefined
  total: number
}

interface SiblingPageResult {
  result: LineageSibling[]
  nextPage: number | undefined
  total: number
}

const CardShimmer: FC<{ count?: number }> = ({ count = 2 }) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              height: 48,
              backgroundColor: theme.palette.action.hover,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          />
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: theme.palette.action.hover
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ height: 16, width: '40%', backgroundColor: theme.palette.action.hover, borderRadius: 1, mb: 1 }}
              />
              <Box
                sx={{ height: 14, width: '60%', backgroundColor: theme.palette.action.hover, borderRadius: 1, mb: 0.5 }}
              />
              <Box sx={{ height: 12, width: '50%', backgroundColor: theme.palette.action.hover, borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const EmptyState: FC<{ message: string }> = ({ message }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 8,
        flexDirection: 'column'
      }}
    >
      <NoDataFound variant='Meerkat' height={150} width={150} />
      <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary, fontWeight: 400, mt: 2 }}>
        {message}
      </Typography>
    </Box>
  )
}

interface PillTabProps {
  tabs: string[]
  activeTab: string
  onTabClick: (tab: string) => void
}

const PillTabs: FC<PillTabProps> = ({ tabs, activeTab, onTabClick }) => {
  const theme = useTheme() as any

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {tabs.map(tab => (
          <Box
            key={tab}
            onClick={() => onTabClick(tab)}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '6px',
              backgroundColor:
                activeTab === tab
                  ? theme.palette.secondary.dark
                  : theme.palette.customColors?.mdAntzNeutral || alpha(theme.palette.grey[500], 0.08),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Typography
              sx={{
                color: activeTab === tab ? theme.palette.primary.contrastText : theme.palette.text.primary,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {tab}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

interface AddFamilyCardProps {
  title: string
  onClick: () => void
  disabled?: boolean
}

const AddFamilyCard: FC<AddFamilyCardProps> = ({ title, onClick, disabled = false }) => {
  const theme = useTheme() as any

  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        backgroundColor: disabled
          ? alpha(theme.palette.grey[500], 0.08)
          : theme.palette.customColors?.surfaceVariant || alpha(theme.palette.success.main, 0.08),
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        mb: 2,
        opacity: disabled ? 0.5 : 1,
        '&:hover': disabled
          ? {}
          : {
              backgroundColor: alpha(theme.palette.success.main, 0.12)
            }
      }}
    >
      <AddIcon sx={{ fontSize: 20, color: disabled ? theme.palette.grey[500] : theme.palette.success.dark }} />
      <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: theme.palette.text.primary }}>
        {title}
      </Typography>
    </Box>
  )
}

interface SectionHeaderProps {
  parentType: string
  isConfirmed: boolean
  isExternal?: boolean
  totalCount: number
  onAdd?: () => void
  onEdit?: () => void
  showAdd?: boolean
  showEdit?: boolean
}

const SectionHeader: FC<SectionHeaderProps> = ({
  parentType,
  isConfirmed,
  isExternal,
  totalCount,
  onAdd,
  onEdit,
  showAdd = true,
  showEdit = false
}) => {
  const theme = useTheme()
  const title = isExternal ? `External ${parentType}` : parentType

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        backgroundColor: theme.palette.action.hover,
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        border: `1px solid ${theme.palette.divider}`,
        borderBottom: 'none'
      }}
    >
      <Box>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.secondary }}>
          {title}
        </Typography>
        {!isConfirmed && totalCount > 1 && (
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: theme.palette.primary.main }}>
            Probable {totalCount}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {showEdit && onEdit && (
          <IconButton size='small' onClick={onEdit} sx={{ color: theme.palette.primary.main }}>
            <EditIcon fontSize='small' />
          </IconButton>
        )}
        {showAdd && onAdd && !isExternal && (
          <IconButton size='small' onClick={onAdd} sx={{ color: theme.palette.primary.main }}>
            <AddCircleIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}

interface MoreItemsButtonProps {
  count: number
  onClick: () => void
}

const MoreItemsButton: FC<MoreItemsButtonProps> = ({ count, onClick }) => {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 1.5,
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04)
        }
      }}
    >
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.primary.main }}>
        + {count} More
      </Typography>
    </Box>
  )
}

interface ParentAnimalCardWrapperProps {
  animal: LineageAnimal | ExternalAnimal
  isExternal?: boolean
  isLast?: boolean
  showRemove?: boolean
  onRemove?: () => void
  onClick?: () => void
}

const ParentAnimalCardWrapper: FC<ParentAnimalCardWrapperProps> = ({
  animal,
  isExternal = false,
  isLast = false,
  showRemove = false,
  onRemove,
  onClick
}) => {
  const theme = useTheme()

  const transformedData = {
    animal_id: isExternal ? undefined : (animal as LineageAnimal).animal_id,
    local_identifier_name: (animal as any).local_identifier_name,
    local_identifier_value: (animal as any).local_identifier_value || (animal as any).local_identifier,
    default_icon: (animal as any).default_icon || (animal as any).image_url,
    common_name: (animal as any).common_name || (animal as any).vernacular_name,
    default_common_name: (animal as any).default_common_name,
    scientific_name: (animal as any).scientific_name,
    complete_name: (animal as any).complete_name,
    sex: animal.sex,
    gender: animal.sex,
    type: (animal as any).type,
    total_animal: (animal as any).total_animal,
    user_enclosure_name: (animal as any).user_enclosure_name || (animal as any).enclosure_name,
    section_name: (animal as any).section_name,
    site_name: (animal as any).site_name,
    breed_name: (animal as any).breed_name,
    morph_name: (animal as any).morph_name
  }

  const isAlive = () => {
    const aliveValue = animal.is_alive
    if (typeof aliveValue === 'number') return aliveValue === 1
    if (typeof aliveValue === 'string') return aliveValue === '1'

    return true
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: isLast ? `1px solid ${theme.palette.divider}` : 'none',
        borderBottomLeftRadius: isLast ? '8px' : 0,
        borderBottomRightRadius: isLast ? '8px' : 0,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        '&:hover': onClick
          ? {
              backgroundColor: alpha(theme.palette.primary.main, 0.02)
            }
          : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ flex: 1 }}>
        {(isExternal || !isAlive()) && (
          <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
            {isExternal && (
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: theme.palette.warning.dark,
                  textTransform: 'uppercase'
                }}
              >
                External
              </Typography>
            )}
            {!isAlive() && (
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  textTransform: 'uppercase'
                }}
              >
                Dead
              </Typography>
            )}
          </Box>
        )}

        <AnimalCard data={transformedData} />

        {isExternal && (animal as ExternalAnimal).organization_name && (
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mt: 1 }}>
            Institute: {(animal as ExternalAnimal).organization_name}
          </Typography>
        )}
      </Box>

      {showRemove && onRemove && (
        <IconButton
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1)
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  )
}

interface ParentSectionCardProps {
  section: ParentSection
  onAnimalClick: (animal: LineageAnimal | ExternalAnimal) => void
  onAdd?: () => void
  onEdit?: () => void
  onRemove?: (animal: LineageAnimal | ExternalAnimal) => void
  onMoreClick?: () => void
  showRemove?: boolean
  showAdd?: boolean
  showEdit?: boolean
}

const ParentSectionCard: FC<ParentSectionCardProps> = ({
  section,
  onAnimalClick,
  onAdd,
  onEdit,
  onRemove,
  onMoreClick,
  showRemove = false,
  showAdd = true,
  showEdit = false
}) => {
  const hasMoreItems = section.totalCount > 1
  const displayData = section.data.slice(0, 1)

  if (section.data.length === 0) return null

  return (
    <Box sx={{ mb: 2 }}>
      <SectionHeader
        parentType={section.parentType}
        isConfirmed={section.isConfirmed}
        isExternal={section.isExternal}
        totalCount={section.totalCount}
        onAdd={onAdd}
        onEdit={onEdit}
        showAdd={showAdd}
        showEdit={showEdit}
      />
      {displayData.map((animal, index) => {
        const isLastDisplayed = index === displayData.length - 1
        const isActuallyLast = !hasMoreItems

        return (
          <ParentAnimalCardWrapper
            key={('animal_id' in animal ? animal.animal_id : 'id' in animal ? animal.id : index) || index}
            animal={animal}
            isExternal={section.isExternal}
            isLast={isLastDisplayed && isActuallyLast}
            showRemove={showRemove && section.totalCount === 1 && section.isConfirmed}
            onRemove={() => onRemove?.(animal)}
            onClick={() => onAnimalClick(animal)}
          />
        )
      })}
      {hasMoreItems && onMoreClick && <MoreItemsButton count={section.totalCount - 1} onClick={onMoreClick} />}
    </Box>
  )
}

interface ParentsTabProps {
  animalId: number
  taxonomyId?: number | string
  isEggAnimal: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

const ParentsTab: FC<ParentsTabProps> = ({ animalId, taxonomyId, isEggAnimal, canAdd, canEdit, canDelete }) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [parentData, setParentData] = useState<LineageParentData | null>(null)

  const [addParentDrawerOpen, setAddParentDrawerOpen] = useState(false)
  const [addParentType, setAddParentType] = useState<'sire' | 'dam'>('sire')
  const [editParentDrawerOpen, setEditParentDrawerOpen] = useState(false)
  const [editParentData, setEditParentData] = useState<ExternalAnimal | null>(null)

  const [externalDetailsOpen, setExternalDetailsOpen] = useState(false)
  const [selectedExternalAnimal, setSelectedExternalAnimal] = useState<ExternalAnimal | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [parentListDrawerOpen, setParentListDrawerOpen] = useState(false)
  const [parentListDrawerSection, setParentListDrawerSection] = useState<ParentSection | null>(null)
  const [parentListEditMode, setParentListEditMode] = useState(false)

  const [parentToDelete, setParentToDelete] = useState<{
    animal: LineageAnimal | ExternalAnimal
    parentType: 'sire' | 'dam'
    isExternal: boolean
  } | null>(null)

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getLineageParents({ animal_id: animalId })
      if (res?.success && res?.data) {
        setParentData(res.data)
      }
    } catch (error) {
      console.error('Error fetching parents:', error)
    } finally {
      setLoading(false)
    }
  }, [animalId])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  const handleAnimalClick = (animal: LineageAnimal | ExternalAnimal, isExternal: boolean) => {
    if (isExternal) {
      setSelectedExternalAnimal(animal as ExternalAnimal)
      setExternalDetailsOpen(true)
    } else if ('animal_id' in animal && animal.animal_id) {
      router.push(`/housing/animals/${animal.animal_id}`)
    }
  }

  const handleAddParent = (parentType: 'sire' | 'dam') => {
    setAddParentType(parentType)
    setAddParentDrawerOpen(true)
  }

  const handleEditParent = (animal: ExternalAnimal, parentType: 'sire' | 'dam') => {
    setEditParentData(animal)
    setAddParentType(parentType)
    setEditParentDrawerOpen(true)
  }

  const handleRemoveParent = (
    animal: LineageAnimal | ExternalAnimal,
    parentType: 'sire' | 'dam',
    isExternal: boolean
  ) => {
    setParentToDelete({ animal, parentType, isExternal })
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteParent = async () => {
    if (!parentToDelete) return

    setDeleteLoading(true)
    try {
      const entityParentId = parentToDelete.isExternal
        ? (parentToDelete.animal as ExternalAnimal).external_parent_id || (parentToDelete.animal as ExternalAnimal).id
        : (parentToDelete.animal as LineageAnimal).id

      const payload = {
        entity_parent_id: JSON.stringify([entityParentId])
      }

      const res = await deleteLineageParent(payload as DeleteParentPayload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Parent removed successfully' })
        fetchParents()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to remove parent' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    } finally {
      setDeleteLoading(false)
      setDeleteConfirmOpen(false)
      setParentToDelete(null)
    }
  }

  const handleParentSuccess = () => {
    fetchParents()
  }

  const handleMoreClick = (section: ParentSection) => {
    setParentListDrawerSection(section)
    setParentListEditMode(false)
    setParentListDrawerOpen(true)
  }

  const handleEditInternalParent = (section: ParentSection) => {
    setParentListDrawerSection(section)
    setParentListEditMode(true)
    setParentListDrawerOpen(true)
  }

  const handleParentListRemove = async (animals: (LineageAnimal | ExternalAnimal)[]) => {
    if (animals.length === 0) return

    const entityParentIds = animals.map(animal => {
      if (parentListDrawerSection?.isExternal) {
        return (animal as ExternalAnimal).external_parent_id || (animal as ExternalAnimal).id
      }

      return (animal as LineageAnimal).id
    })

    try {
      const payload = {
        entity_parent_id: JSON.stringify(entityParentIds)
      }

      const res = await deleteLineageParent(payload as DeleteParentPayload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Parent(s) removed successfully' })
        setParentListDrawerOpen(false)
        setParentListDrawerSection(null)
        setParentListEditMode(false)
        fetchParents()
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to remove parent(s)' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    }
  }

  const handleParentListAnimalClick = (animal: LineageAnimal | ExternalAnimal) => {
    if (parentListDrawerSection?.isExternal) {
      setSelectedExternalAnimal(animal as ExternalAnimal)
      setExternalDetailsOpen(true)
      setParentListDrawerOpen(false)
    } else if ('animal_id' in animal && animal.animal_id) {
      router.push(`/housing/animals/${animal.animal_id}`)
    }
  }

  const sections = useMemo((): ParentSection[] => {
    if (!parentData) return []

    const ensureArray = <T,>(val: T | T[] | undefined): T[] => {
      if (!val) return []

      return Array.isArray(val) ? val : [val]
    }

    const stats = {
      motherCount: Number(parentData.mother_count || 0),
      fatherCount: Number(parentData.father_count || 0),
      extMotherCount: Number(parentData.external_mother_count || 0),
      extFatherCount: Number(parentData.external_father_count || 0)
    }

    const allSections: ParentSection[] = [
      {
        key: 'internal-dam',
        data: ensureArray(parentData.mother),
        parentType: 'Dam',
        isConfirmed: stats.motherCount <= 1,
        isExternal: false,
        totalCount: stats.motherCount
      },
      {
        key: 'internal-sire',
        data: ensureArray(parentData.father),
        parentType: 'Sire',
        isConfirmed: stats.fatherCount <= 1,
        isExternal: false,
        totalCount: stats.fatherCount
      },
      {
        key: 'external-dam',
        data: ensureArray(parentData.external_mother),
        parentType: 'Dam',
        isConfirmed: true,
        isExternal: true,
        totalCount: stats.extMotherCount || 1
      },
      {
        key: 'external-sire',
        data: ensureArray(parentData.external_father),
        parentType: 'Sire',
        isConfirmed: true,
        isExternal: true,
        totalCount: stats.extFatherCount || 1
      }
    ]

    return allSections.filter(s => s.data.length > 0)
  }, [parentData])

  const showAddSire =
    parentData && Number(parentData.father_count || 0) <= 0 && Number(parentData.external_father_count || 0) <= 0

  const showAddDam =
    parentData && Number(parentData.mother_count || 0) <= 0 && Number(parentData.external_mother_count || 0) <= 0

  const canShowAddButtons = canAdd && !isEggAnimal

  if (loading) return <CardShimmer />

  const willShowAddCards = (showAddSire || showAddDam) && canShowAddButtons
  const hasNoData = sections.length === 0 && !willShowAddCards

  if (hasNoData) return <EmptyState message='No Parents Recorded' />

  return (
    <Box>
      {showAddSire && canShowAddButtons && (
        <AddFamilyCard title='Add Sire (Father)' onClick={() => handleAddParent('sire')} />
      )}

      {showAddDam && canShowAddButtons && (
        <AddFamilyCard title='Add Dam (Mother)' onClick={() => handleAddParent('dam')} />
      )}

      {sections.map(section => {
        const showEditIcon = section.isExternal
          ? canEdit
          : !isEggAnimal && canDelete && section.totalCount > 1

        const handleEditClick = section.isExternal
          ? () =>
              handleEditParent(section.data[0] as ExternalAnimal, section.parentType.toLowerCase() as 'sire' | 'dam')
          : () => handleEditInternalParent(section)

        return (
          <ParentSectionCard
            key={section.key}
            section={section}
            onAnimalClick={animal => handleAnimalClick(animal, section.isExternal)}
            onAdd={() => handleAddParent(section.parentType.toLowerCase() as 'sire' | 'dam')}
            onEdit={showEditIcon ? handleEditClick : undefined}
            onRemove={animal =>
              handleRemoveParent(animal, section.parentType.toLowerCase() as 'sire' | 'dam', section.isExternal)
            }
            onMoreClick={section.totalCount > 1 ? () => handleMoreClick(section) : undefined}
            showRemove={canDelete && section.isConfirmed && (!isEggAnimal || section.isExternal)}
            showAdd={canShowAddButtons && !section.isExternal}
            showEdit={showEditIcon}
          />
        )
      })}

      <AddParentDrawer
        open={addParentDrawerOpen}
        onClose={() => setAddParentDrawerOpen(false)}
        animalId={animalId}
        taxonomyId={taxonomyId}
        parentType={addParentType}
        onSuccess={handleParentSuccess}
        isEggAnimal={isEggAnimal}
      />

      <AddParentDrawer
        open={editParentDrawerOpen}
        onClose={() => {
          setEditParentDrawerOpen(false)
          setEditParentData(null)
        }}
        animalId={animalId}
        taxonomyId={taxonomyId}
        parentType={addParentType}
        onSuccess={handleParentSuccess}
        editMode
        editData={editParentData}
        isEggAnimal={isEggAnimal}
      />

      <ExternalAnimalDetailsDialog
        open={externalDetailsOpen}
        onClose={() => {
          setExternalDetailsOpen(false)
          setSelectedExternalAnimal(null)
        }}
        animal={selectedExternalAnimal}
      />

      <ConfirmationDialog
        dialogBoxStatus={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setParentToDelete(null)
        }}
        title='Remove Parent'
        description='Are you sure you want to remove this parent?'
        ConfirmationText='Remove'
        confirmAction={confirmDeleteParent}
        loading={deleteLoading}
        icon='mdi:account-remove'
        iconColor='error'
      />

      {parentListDrawerSection && (
        <ParentListDrawer
          open={parentListDrawerOpen}
          onClose={() => {
            setParentListDrawerOpen(false)
            setParentListDrawerSection(null)
            setParentListEditMode(false)
          }}
          animalId={animalId}
          parentType={parentListDrawerSection.parentType}
          isExternal={parentListDrawerSection.isExternal}
          totalCount={parentListDrawerSection.totalCount}
          initialData={parentListDrawerSection.isExternal ? parentListDrawerSection.data : []}
          onAnimalClick={handleParentListAnimalClick}
          editMode={parentListEditMode}
          onRemove={handleParentListRemove}
        />
      )}
    </Box>
  )
}

interface PairCardProps {
  pair: LineagePair
  onAnimalClick: () => void
  onEdit?: () => void
  onDelete?: () => void
  showEdit?: boolean
  showDelete?: boolean
}

const PairCard: FC<PairCardProps> = ({
  pair,
  onAnimalClick,
  onEdit,
  onDelete,
  showEdit = false,
  showDelete = false
}) => {
  const theme = useTheme()

  const formatPairDuration = () => {
    const isValidDate = (date?: string | null) => !!date && date !== '0000-00-00'
    const hasStart = isValidDate(pair.start_date)
    const hasEnd = isValidDate(pair.end_date)

    if (!hasStart && !hasEnd) return { text: 'Unknown', isPresent: false }

    const formattedStart = hasStart ? Utility.formatDisplayDate(pair.start_date) : 'Unknown'
    const formattedEnd = hasEnd ? Utility.formatDisplayDate(pair.end_date) : 'Present'

    return { text: `${formattedStart} - ${formattedEnd}`, isPresent: !hasEnd }
  }

  const { text: durationText, isPresent } = formatPairDuration()

  const isExternal = pair.animal_type === 'external' || pair.pair_animal_type === 'external'

  const details = pair.pair_animal_details as LineageAnimal | undefined

  const pairAnimal: LineageAnimal = {
    animal_id: Number(pair.animal_id || pair.pair_animal_id),
    common_name: pair.common_name || pair.pair_common_name || details?.common_name,
    default_common_name: pair.default_common_name,
    vernacular_name: pair.vernacular_name || details?.vernacular_name,
    complete_name: pair.complete_name || details?.complete_name,
    sex: pair.sex || pair.pair_sex || details?.sex,
    is_alive: pair.is_alive ?? pair.pair_is_alive ?? details?.is_alive,
    image_url: pair.image_url || pair.pair_image_url || details?.image_url,
    default_icon: pair.default_icon || details?.default_icon,
    local_identifier_value: pair.local_identifier_value || pair.local_identifier || details?.local_identifier_value,
    local_identifier_name: pair.local_identifier_name || details?.local_identifier_name,
    user_enclosure_name: pair.user_enclosure_name || details?.user_enclosure_name,
    enclosure_name: pair.enclosure_name || details?.enclosure_name,
    section_name: pair.section_name || details?.section_name,
    site_name: pair.site_name || details?.site_name,
    type: pair.type || details?.type,
    breed_name: pair.breed_name,
    morph_name: pair.morph_name,
    organization_name: pair.organization_name || pair.institute_name
  }

  const transformedData = {
    animal_id: pairAnimal.animal_id,
    local_identifier_name: pairAnimal.local_identifier_name,
    local_identifier_value: pairAnimal.local_identifier_value,
    default_icon: pairAnimal.default_icon || pairAnimal.image_url,
    common_name: pairAnimal.common_name || pairAnimal.vernacular_name,
    default_common_name: pairAnimal.default_common_name,
    scientific_name: pairAnimal.complete_name,
    complete_name: pairAnimal.complete_name,
    sex: pairAnimal.sex,
    gender: pairAnimal.sex,
    type: pairAnimal.type,
    total_animal: pairAnimal.total_animal,
    user_enclosure_name: pairAnimal.user_enclosure_name || pairAnimal.enclosure_name,
    section_name: pairAnimal.section_name,
    site_name: pairAnimal.site_name,
    breed_name: pairAnimal.breed_name,
    morph_name: pairAnimal.morph_name
  }

  const isAlive = () => {
    const aliveValue = pairAnimal.is_alive
    if (typeof aliveValue === 'number') return aliveValue === 1
    if (typeof aliveValue === 'string') return aliveValue === '1'

    return true
  }

  return (
    <Box
      sx={{
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: isPresent ? theme.palette.background.paper : alpha(theme.palette.grey[500], 0.08)
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: isPresent ? 'transparent' : alpha(theme.palette.grey[500], 0.04)
        }}
      >
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: isPresent ? theme.palette.text.primary : theme.palette.text.secondary
          }}
        >
          Pair Duration: {durationText}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {showEdit && onEdit && (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
              sx={{ color: theme.palette.primary.main }}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          )}
          {showDelete && onDelete && (
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box
        onClick={onAnimalClick}
        sx={{
          p: 2,
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      >
        {(isExternal || !isAlive()) && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            {isExternal && (
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: theme.palette.warning.dark,
                  textTransform: 'uppercase'
                }}
              >
                External
              </Typography>
            )}
            {!isAlive() && (
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  textTransform: 'uppercase'
                }}
              >
                Dead
              </Typography>
            )}
          </Box>
        )}

        <AnimalCard data={transformedData} />

        {isExternal && pairAnimal.organization_name && (
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary, mt: 1 }}>
            Institute: {pairAnimal.organization_name}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

interface PairsTabProps {
  animalId: number
  animalSex: string
  taxonomyId?: number | string
  isEggAnimal: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

const PairsTab: FC<PairsTabProps> = ({ animalId, animalSex, taxonomyId, isEggAnimal, canAdd, canEdit, canDelete }) => {
  const router = useRouter()

  const PAGE_SIZE = 20
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef<boolean>(false)

  const [addPairDrawerOpen, setAddPairDrawerOpen] = useState(false)
  const [editPairDrawerOpen, setEditPairDrawerOpen] = useState(false)
  const [editPairData, setEditPairData] = useState<LineagePair | null>(null)

  const [externalDetailsOpen, setExternalDetailsOpen] = useState(false)
  const [selectedExternalAnimal, setSelectedExternalAnimal] = useState<ExternalAnimal | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [pairToDelete, setPairToDelete] = useState<LineagePair | null>(null)
  const [conflictConfirmOpen, setConflictConfirmOpen] = useState(false)
  const [conflictMessage, setConflictMessage] = useState<string>('')

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery<PairPageResult>({
    queryKey: ['lineage-pairs', animalId],
    queryFn: async ({ pageParam }) => {
      const res = await getLineagePairs({
        animal_id: animalId,
        page_no: pageParam as number,
        limit: PAGE_SIZE
      })

      const resultData = res?.data || []
      const totalCount = res?.total_count || 0

      return {
        result: resultData,
        nextPage: resultData.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: totalCount
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PairPageResult) => lastPage.nextPage
  })

  const pairs = useMemo(() => queryData?.pages?.flatMap((page: PairPageResult) => page?.result) || [], [queryData])

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleAnimalClick = (pair: LineagePair) => {
    const isExternalPair = pair.animal_type === 'external' || pair.pair_animal_type === 'external'
    const pairedAnimalId = pair.animal_id || pair.pair_animal_id

    if (isExternalPair) {
      const externalAnimal: ExternalAnimal = {
        id: Number(pairedAnimalId),
        sex: pair.sex || pair.pair_sex,
        is_alive: pair.is_alive ?? pair.pair_is_alive,
        breed_name: pair.breed_name,
        morph_name: pair.morph_name,
        organization_name: pair.organization_name || pair.institute_name,
        common_name: pair.common_name || pair.pair_common_name,
        local_identifier: pair.identifier || pair.local_identifier || pair.local_identifier_value
      }
      setSelectedExternalAnimal((pair.pair_animal_details as ExternalAnimal) || externalAnimal)
      setExternalDetailsOpen(true)
    } else if (pairedAnimalId) {
      router.push(`/housing/animals/${pairedAnimalId}`)
    }
  }

  const handleEditPair = (pair: LineagePair) => {
    setEditPairData(pair)
    setEditPairDrawerOpen(true)
  }

  const handleDeletePair = (pair: LineagePair) => {
    setPairToDelete(pair)
    setDeleteConfirmOpen(true)
  }

  const confirmDeletePair = async (confirmDelete: 0 | 1 = 0) => {
    const pairId = pairToDelete?.id || pairToDelete?.pair_id
    if (!pairId) return

    setDeleteLoading(true)
    try {
      const payload: DeletePairPayload = {
        pair_id: pairId,
        confirm_delete: confirmDelete
      }

      const res = await deleteLineagePair(payload)
      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Pair removed successfully' })
        refetch()
        setDeleteConfirmOpen(false)
        setConflictConfirmOpen(false)
        setPairToDelete(null)
      } else if (res?.data?.pair_present) {
        setDeleteConfirmOpen(false)
        setConflictMessage(res?.message || 'This pair has linked records. Are you sure you want to remove it?')
        setConflictConfirmOpen(true)
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to remove pair' })
      }
    } catch (error: any) {
      Toaster({ type: 'error', message: error?.message || 'An error occurred' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const confirmConflictDelete = async () => {
    await confirmDeletePair(1)
  }

  const cancelConflictDelete = () => {
    setConflictConfirmOpen(false)
    setPairToDelete(null)
    setConflictMessage('')
  }

  const handlePairSuccess = () => {
    refetch()
  }

  const canShowAddButton = canAdd && !isEggAnimal

  if (isFetching && pairs.length === 0) return <CardShimmer />

  return (
    <Box>
      {canShowAddButton && <AddFamilyCard title='Add Pair' onClick={() => setAddPairDrawerOpen(true)} />}

      {pairs.length === 0 && !isFetching ? (
        <EmptyState message='No Pairs Recorded' />
      ) : (
        <>
          {pairs.map((pair, index) => (
            <PairCard
              key={pair.id || pair.pair_id || index}
              pair={pair}
              onAnimalClick={() => handleAnimalClick(pair)}
              onEdit={() => handleEditPair(pair)}
              onDelete={() => handleDeletePair(pair)}
              showEdit={canEdit}
              showDelete={canDelete}
            />
          ))}

          {(isFetchingNextPage || hasNextPage) && pairs.length > 0 && (
            <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </>
      )}

      <AddPairDrawer
        open={addPairDrawerOpen}
        onClose={() => setAddPairDrawerOpen(false)}
        animalId={animalId}
        animalSex={animalSex}
        taxonomyId={taxonomyId}
        onSuccess={handlePairSuccess}
      />

      <AddPairDrawer
        open={editPairDrawerOpen}
        onClose={() => {
          setEditPairDrawerOpen(false)
          setEditPairData(null)
        }}
        animalId={animalId}
        animalSex={animalSex}
        taxonomyId={taxonomyId}
        onSuccess={handlePairSuccess}
        editMode
        editData={editPairData}
      />

      <ExternalAnimalDetailsDialog
        open={externalDetailsOpen}
        onClose={() => {
          setExternalDetailsOpen(false)
          setSelectedExternalAnimal(null)
        }}
        animal={selectedExternalAnimal}
      />

      <ConfirmationDialog
        dialogBoxStatus={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setPairToDelete(null)
        }}
        title='Remove Pair'
        description='Are you sure you want to remove this pair?'
        ConfirmationText='Remove'
        confirmAction={() => confirmDeletePair(0)}
        loading={deleteLoading}
        icon='mdi:account-multiple-remove'
        iconColor='error'
      />

      <ConfirmationDialog
        dialogBoxStatus={conflictConfirmOpen}
        onClose={cancelConflictDelete}
        title='Remove Pair'
        description={conflictMessage}
        ConfirmationText='Yes, Remove'
        confirmAction={confirmConflictDelete}
        loading={deleteLoading}
        icon='mdi:alert'
        iconColor='warning'
      />
    </Box>
  )
}

interface SiblingsTabProps {
  animalId: number
}

const SiblingsTab: FC<SiblingsTabProps> = ({ animalId }) => {
  const router = useRouter()
  const theme = useTheme()

  const PAGE_SIZE = 20
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef<boolean>(false)

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery<SiblingPageResult>({
    queryKey: ['lineage-siblings', animalId],
    queryFn: async ({ pageParam }) => {
      const res = await getLineageSiblings({
        animal_id: animalId,
        page_no: pageParam as number,
        limit: PAGE_SIZE
      })

      const resultData = res?.data?.result || []
      const totalCount = res?.data?.total_count || 0

      return {
        result: resultData,
        nextPage: resultData.length === PAGE_SIZE ? (pageParam as number) + 1 : undefined,
        total: totalCount
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: SiblingPageResult) => lastPage.nextPage
  })

  const siblings = useMemo(
    () => queryData?.pages?.flatMap((page: SiblingPageResult) => page?.result) || [],
    [queryData]
  )

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleSiblingClick = (sibling: LineageSibling) => {
    if (sibling.animal_id) {
      router.push(`/housing/animals/${sibling.animal_id}`)
    }
  }

  const transformSiblingData = (sibling: LineageSibling) => ({
    animal_id: sibling.animal_id,
    local_identifier_name: sibling.local_identifier_name,
    local_identifier_value: sibling.local_identifier_value,
    default_icon: sibling.default_icon || sibling.image_url,
    common_name: sibling.common_name || sibling.vernacular_name,
    default_common_name: sibling.default_common_name,
    scientific_name: sibling.scientific_name,
    complete_name: sibling.complete_name,
    sex: sibling.sex,
    gender: sibling.sex,
    type: sibling.type,
    total_animal: sibling.total_animal,
    user_enclosure_name: sibling.user_enclosure_name || sibling.enclosure_name,
    section_name: sibling.section_name,
    site_name: sibling.site_name,
    breed_name: sibling.breed_name,
    morph_name: sibling.morph_name
  })

  if (isFetching && siblings.length === 0) return <CardShimmer />
  if (siblings.length === 0 && !isFetching) return <EmptyState message='No Siblings Found' />

  return (
    <Box>
      {siblings.map((sibling, index) => (
        <Box
          key={sibling.animal_id || index}
          onClick={() => handleSiblingClick(sibling)}
          sx={{
            mb: 1.5,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.02)
            }
          }}
        >
          <AnimalCard data={transformSiblingData(sibling)} />
        </Box>
      ))}

      {(isFetchingNextPage || hasNextPage) && siblings.length > 0 && (
        <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  )
}

const AnimalLineage: FC<AnimalLineageProps> = ({ animalDetails }) => {
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext) as any

  const animalId = Number(id)
  const animalSex = animalDetails?.sex?.toLowerCase() || ''
  const animalType = animalDetails?.type?.toLowerCase()
  const taxonomyId = animalDetails?.taxonomy_id
  const isEggAnimal = Number(animalDetails?.is_egg_animal) !== 0

  const collectionAnimalRecordAccess = authData?.userData?.roles?.settings?.collection_animal_record_access

  const canDelete = collectionAnimalRecordAccess === 'DELETE'
  const canEdit = canDelete || collectionAnimalRecordAccess === 'EDIT'
  const canAdd = canEdit || collectionAnimalRecordAccess === 'ADD'

  const showPairsTab = animalType === 'single' && (animalSex === 'male' || animalSex === 'female')

  const availableTabs: LineageTabType[] = showPairsTab ? ['Parents', 'Pairs', 'Siblings'] : ['Parents', 'Siblings']

  const [activeTab, setActiveTab] = useState<LineageTabType>('Parents')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Parents':
        return (
          <ParentsTab
            animalId={animalId}
            taxonomyId={taxonomyId}
            isEggAnimal={isEggAnimal}
            canAdd={canAdd}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )
      case 'Pairs':
        return (
          <PairsTab
            animalId={animalId}
            animalSex={animalSex}
            taxonomyId={taxonomyId}
            isEggAnimal={isEggAnimal}
            canAdd={canAdd}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )
      case 'Siblings':
        return <SiblingsTab animalId={animalId} />
      default:
        return null
    }
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <PillTabs tabs={availableTabs} activeTab={activeTab} onTabClick={tab => setActiveTab(tab as LineageTabType)} />
      </Box>
      {renderTabContent()}
    </Box>
  )
}

export default AnimalLineage
