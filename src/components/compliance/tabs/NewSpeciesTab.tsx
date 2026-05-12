import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Typography, Button, TextField, CircularProgress, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import Search from 'src/views/utility/Search'
import SelectableSpeciesCard from '../../../views/pages/compliance/documents/exports/SelectableSpeciesCard'
import { createSpecies, getMasterSpeciesList } from 'src/lib/api/compliance/exports'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import debounce from 'lodash/debounce'
import Toaster from 'src/components/Toaster'
import type { NewSpeciesTabProps } from 'src/types/compliance'
import type { Species } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10

const NewSpeciesTab = ({ selectedItems, onToggle, prevSelectedItems, onAddSpecies }: NewSpeciesTabProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [showForm, setShowForm] = useState<boolean>(false)
  const [formData, setFormData] = useState<{ commonName: string; scientificName: string }>({
    commonName: '',
    scientificName: ''
  })
  const [list, setList] = useState<Species[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [createSpeciesLoader, setCreateSpeciesLoader] = useState<boolean>(false)

  // Debounced search
  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      setSearch(searchValue)
      setPage(1)
    }, 500)
  ).current

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const fetchData = useCallback(async (pageNum = 1, searchQuery = '') => {
    setIsLoading(true)
    try {
      const res = await getMasterSpeciesList({
        page_no: pageNum,
        limit: PAGE_SIZE,
        q: searchQuery
      })

      const newItems: Species[] = ((res?.data as any)?.records || []).map((item: any) => ({
        ...item,
        tsn_id: item?.taxonomy_id ?? undefined,
        id: item?.id ?? undefined
      }))
      const totalCount = (res?.data as any)?.total || 0

      setTotal(totalCount)
      setList(prev => (pageNum === 1 ? newItems : [...prev, ...newItems]))
      setHasMore(newItems.length === PAGE_SIZE)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchData(nextPage, search)
    }
  }, [isLoading, hasMore, page, search, fetchData])

  const loaderRef = useInfiniteScroll(loadMore, isLoading, hasMore)

  useEffect(() => {
    fetchData(1, search)
  }, [search, fetchData])

  const handleAddClick = () => setShowForm(true)

  const handleCancel = () => {
    setShowForm(false)
    setFormData({ commonName: '', scientificName: '' })
  }

  const handleSubmit = async () => {
    if (formData.commonName.trim() && formData.scientificName.trim()) {
      setCreateSpeciesLoader(true)
      try {
        const params = {
          common_name: formData.commonName.trim(),
          scientific_name: formData.scientificName.trim(),
          default_icon: '/branding/antz/Antz_logomark_h_color.svg'
        }

        const res = await createSpecies(params)

        if (res.success) {
          onAddSpecies({
            id: (res.data as any)?.id,
            tsn_id: undefined,
            common_name: formData.commonName.trim(),
            scientific_name: formData.scientificName.trim()
          })
          Toaster({ type: 'success', message: res.message })
          handleCancel()
        } else {
          Toaster({ type: 'error', message: res.message })
        }
      } catch (error) {
        Toaster({ type: 'error', message: (error as Error).message })
      } finally {
        setCreateSpeciesLoader(false)
      }
    }
  }

  const filteredList = list.filter(species => !prevSelectedItems.some(item => item?.id == species?.id))

  return (
    <>
      {!showForm ? (
        <Button
          variant='contained'
          onClick={handleAddClick}
          sx={{
            my: 4,
            backgroundColor: theme.palette.customColors.OnPrimaryContainer,
            color: theme.palette.common.white,
            py: 4,
            width: '100%',
            '&:hover': { backgroundColor: theme.palette.customColors.OnPrimaryContainer }
          }}
        >
          {t('compliance_module.add_new_species')}
        </Button>
      ) : (
        <Box
          sx={{
            my: 4,
            p: 4,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '1.25rem', fontWeight: 500 }}
            >
              {t('compliance_module.add_new_species')}
            </Typography>
            <IconButton onClick={handleCancel}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <TextField
              label={t('compliance_module.common_name')}
              variant='outlined'
              fullWidth
              value={formData.commonName}
              onChange={e => setFormData(prev => ({ ...prev, commonName: e.target.value }))}
              placeholder={t('compliance_module.enter_common_name')}
            />
            <TextField
              label={t('compliance_module.scientific_name')}
              variant='outlined'
              fullWidth
              value={formData.scientificName}
              onChange={e => setFormData(prev => ({ ...prev, scientificName: e.target.value }))}
              placeholder={t('compliance_module.enter_scientific_name')}
            />
            <Button
              variant='contained'
              onClick={handleSubmit}
              disabled={!formData.commonName.trim() || !formData.scientificName.trim() || createSpeciesLoader}
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                color: theme.palette.common.white,
                py: 4,
                width: '100%',
                '&:hover': { backgroundColor: theme.palette.customColors.OnPrimaryContainer },
                position: 'relative' // Needed for absolute positioning of loader
              }}
            >
              {createSpeciesLoader ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-12px'
                    }}
                  />
                  <span style={{ opacity: 0 }}>{t('compliance_module.save_and_select')}</span>
                </>
              ) : (
                t('compliance_module.save_and_select')
              )}
            </Button>
          </Box>
        </Box>
      )}

      <Search
        sx={{ width: '100%' }}
        textFielsSX={{
          width: '100%',
          height: 52,
          borderRadius: '8px',
          backgroundColor: theme.palette.common.white
        }}
        placeholder={t('compliance_module.search_custom_species')}
        value={localSearch}
        onChange={e => {
          const value = e.target.value
          setLocalSearch(value)
          debouncedSearch(value)
        }}
        onClear={() => {
          setLocalSearch('')
          debouncedSearch('')
        }}
        backgroundColor={theme.palette.common.white}
      />

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
        {t('species')} {total ? `(${total})` : ''}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
        {filteredList.map(species => (
          <SelectableSpeciesCard
            key={species?.id}
            species={species}
            selected={selectedItems.some(item => item.id === species.id)}
            onClick={() => onToggle(species)}
            selectionType='radio'
          />
        ))}

        {isLoading && filteredList.length === 0 && (
          <Box display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {(isLoading || hasMore) && filteredList.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && filteredList.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            {t('compliance_module.no_custom_species_found')}
          </Typography>
        )}

        {!hasMore && filteredList.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('compliance_module.no_more_species_to_load')}
          </Typography>
        )}
      </Box>
    </>
  )
}

export default React.memo(NewSpeciesTab)
