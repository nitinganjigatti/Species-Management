import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Card } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'

import CustomDrawer from '../../../views/pages/housing/utils/CustomDrawer'
import { CellInfo } from 'src/utility/render'
import Search from 'src/views/utility/Search'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import SpeciesInnerCard from 'src/views/pages/housing/species/SpeciesInnerCard'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { Animal } from 'src/types/housing'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'

interface AnimalsDrawerData {
  queryKey: string
  id: number | string
  name?: string
  image?: string
  params: Record<string, unknown>
  complete_name?: string
  default_icon?: string
  common_name?: string
  sex_data?: Record<string, unknown>
  animal_count?: number
}

interface AnimalsDrawerProps {
  open: boolean
  onClose: () => void
  data: AnimalsDrawerData | null
  totalCount?: number
  defaultImage?: string
  objectFit?: string
}

interface PageResult {
  result: Animal[]
  nextPage: number | undefined
  total: number
}

const AnimalsDrawer: React.FC<AnimalsDrawerProps> = ({ open, onClose, data, totalCount, defaultImage, objectFit }) => {
  const theme = useTheme() as any
  const queryClient = useQueryClient()
  const router = useSafeRouter()
  const auth = useAuth()
  const { t } = useTranslation()

  // Get permissions from both sources (matching mobile implementation)
  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions: Record<string, string | boolean> = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  // Check if user can view animal details (matching mobile: collection_animal_record_access with VIEW level)
  // Permission hierarchy: VIEW < ADD < EDIT < DELETE (higher levels include lower ones)
  const canViewAnimalDetails = (): boolean => {
    const accessLevel = permissions?.collection_animal_record_access

    return ['VIEW', 'ADD', 'EDIT', 'DELETE'].includes(accessLevel as string)
  }

  const [localSearch, setLocalSearch] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const PAGE_SIZE = 10

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery<PageResult>({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam }) => {
      const res = await getNewAnimalListWithFilters({
        ...data?.params,
        page_no: pageParam as number,
        list_type: 'animals',
        q: search
      })

      // v3 API returns { data: [...], total_count } at top level
      const resultData = (res?.data || []) as unknown as Animal[]
      const totalCount = res?.total_count || 0
      const loaded = (pageParam as number) * PAGE_SIZE

      return {
        result: resultData,
        nextPage: loaded < totalCount ? (pageParam as number) + 1 : undefined,
        total: totalCount
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PageResult) => lastPage.nextPage,
    enabled: Boolean(open && !!data?.id && !!data?.queryKey)
  })

  // Reset local state on open
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open, data?.id])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search] })
      queryClient.removeQueries({ queryKey: [data?.queryKey, data?.id, search] })
      cooldownRef.current = false // reset cooldown on close
    }
  }, [open, data?.id, search, queryClient])

  const list = useMemo(() => queryData?.pages?.flatMap((page: PageResult) => page?.result) || [], [queryData])
  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const resolvedCount = totalCount || total
  const animalsLabel = Number(resolvedCount) === (0 || 1) ? t('navigation.animal') : t('animals')
  const animalHeading = resolvedCount ? `${animalsLabel} (${resolvedCount})` : animalsLabel

  // cooldownRef to prevent multiple rapid calls
  const cooldownRef = useRef<boolean>(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        // add 300ms cooldown before allowing next fetch
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleAnimalClick = (animalId: number | string) => {
    // Check permission before navigating (matching mobile implementation)
    if (!canViewAnimalDetails()) {
      Toaster({ type: 'error', message: t('housing_module.no_animal_permission') })

      return
    }

    router.push(`/animals/${animalId}`)
  }

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={t('animals')}
      icon='/images/housing/Enclosure icon.png'
      iconColor={theme.palette.primary.main}
    >
      {data?.name && (
        <Box
          sx={{
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            backgroundColor: theme.palette.customColors?.OnPrimary,
            paddingX: 4,
            paddingY: 3,
            marginY: 6,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px'
          }}
        >
          {data?.queryKey === 'cluster-animals-drawer' || data?.queryKey === 'enclosure-wise-species-drawer' ? (
            <>
              <SpeciesInnerCard
                completeName={data?.complete_name}
                imgUrl={data?.default_icon || defaultImage}
                commonName={data?.common_name}
                sex={data?.sex_data}
                animalCount={data?.animal_count}
              />
            </>
          ) : (
            <CellInfo
              value={data?.name}
              subtitle=''
              imgUrl={data?.image}
              avatarUrl=''
              inchagename=''
              defaultImage={defaultImage}
              defaultImageAlt=''
              color={(theme.palette as any).customColors?.OnSurfaceVariant}
              subtitleColor={(theme.palette as any).customColors?.secondaryBg}
              objectFit={objectFit}
            />
          )}
        </Box>
      )}
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        {animalHeading}
      </Typography>
      <Box sx={{ my: 2 }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.customColors?.OnPrimary
          }}
          placeholder={t('housing_module.search_for_animals') as string}
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.customColors?.OnPrimary}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {list.map((animal: Animal) => (
          <Box key={animal?.animal_id} onClick={() => handleAnimalClick(animal?.animal_id)}>
            <AnimalParentCard
              data={animal as unknown as { [key: string]: unknown }}
              size={14}
              animal={true}
              backgroundColor=''
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                cursor: canViewAnimalDetails() ? 'pointer' : 'default',
                opacity: canViewAnimalDetails() ? 1 : 0.7,
                '&:hover': canViewAnimalDetails()
                  ? {
                      borderColor: theme.palette.primary.main,
                      background: (theme.palette as any).customColors?.Surface
                    }
                  : {}
              }}
            />
          </Box>
        ))}

        {isFetching && list.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 2,
              mt: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 2,
              mt: 2
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!isFetching && list.length === 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
            {t('housing_module.no_animals_found')}
          </Typography>
        )}

        {!hasNextPage && list.length > 0 && (
          <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
            {t('housing_module.no_more_animals_to_load')}
          </Typography>
        )}
      </Box>
    </CustomDrawer>
  )
}

export default React.memo(AnimalsDrawer)
