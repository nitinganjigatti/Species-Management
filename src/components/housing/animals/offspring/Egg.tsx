import React, { FC, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Box, CircularProgress, useTheme } from '@mui/material'
import debounce from 'lodash/debounce'

import { TabProps, ClutchEgg } from 'src/types/housing/animalsOffspring'
import { getClutchEggList } from 'src/lib/api/housing'

import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import EggCard from './EggCard'
import EggDrawer from './EggDrawer'

const Egg: FC<TabProps> = props => {
  const theme = useTheme() as any

  const [searchInput, setSearchInput] = useState<string>('')
  const [searchEgg, setSearchEgg] = useState<string>('')
  const [eggData, setEggData] = useState<ClutchEgg[] | null>(null)
  const [isEggFetching, setIsEggFetching] = useState<boolean>(false)
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  const [eggDrawerOpen, setEggDrawerOpen] = useState<boolean>(false)
  const [selectedEgg, setSelectedEgg] = useState<ClutchEgg | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)

  const debouncedSearch = useMemo(() => debounce(setSearchEgg, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const fetchEggList = async (pageNo: number = 1, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsFetchingMore(true)
    } else {
      setIsEggFetching(true)
    }

    try {
      const response = await getClutchEggList({
        type: 'offspring',
        q: searchEgg,
        parent_id: props.animalId,
        is_mother: props.isMother,
        page_no: pageNo
      })

      if (response?.success) {
        const newData = response?.data?.result || []
        const total = Number(response?.data?.total_count || 0)

        setTotalCount(total)

        setEggData(prev => (isLoadMore ? [...(prev || []), ...newData] : newData))
      } else {
        setEggData([])
      }
    } catch (error: any) {
      console.error(error?.message)
      setEggData([])
    } finally {
      setIsEggFetching(false)
      setIsFetchingMore(false)
    }
  }

  // Reset on search
  useEffect(() => {
    setPage(1)
    fetchEggList(1, false)
  }, [searchEgg])

  // Load More
  const loadMore = useCallback(() => {
    if (isFetchingMore) return

    if (eggData && eggData.length < totalCount) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchEggList(nextPage, true)
    }
  }, [eggData, totalCount, page, isFetchingMore])

  // Observer for infinite scroll
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingMore) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loadMore, isFetchingMore]
  )

  // Search Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setSearchInput('')
    setSearchEgg('')
  }

  const handleEggDrawerClose = () => {
    setEggDrawerOpen(false)
    setSelectedEgg(null)
  }

  return (
    <>
      <Box sx={{ py: 4, px: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
          <Search
            width='100%'
            placeholder='Search'
            value={searchInput}
            onChange={handleSearch}
            onClear={handleSearchClear}
            inputStyle={{ py: '16px', px: '12px' }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          px: 4
        }}
      >
        {isEggFetching ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
          </Box>
        ) : eggData?.length === 0 ? (
          <NoDataFound width={250} height={250} />
        ) : (
          <>
            {eggData?.map((item, index) => {
              const isLast = index === eggData.length - 1

              return (
                <Box ref={isLast ? lastItemRef : null} key={item.egg_id}>
                  <EggCard
                    imgURl={item.default_icon}
                    defaultName={item.default_common_name}
                    completeName={item.complete_name}
                    eggCode={item.egg_code}
                    eggCondition={item.egg_condition}
                    egg_status={item.egg_status}
                    egg_state={item.egg_state}
                    batch={item.discard_request_id}
                    date={item.collection_date}
                    status={item.discard_activity_status}
                    // handleEggClick={() => {
                    //   setSelectedEgg(item)
                    //   setEggDrawerOpen(true)
                    // }}
                  />
                </Box>
              )
            })}

            {/* Bottom Loader */}
            {isFetchingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </>
        )}
      </Box>
      {/* {eggDrawerOpen && <EggDrawer open={eggDrawerOpen} onClose={handleEggDrawerClose} eggDetails={selectedEgg} />} */}
    </>
  )
}

export default React.memo(Egg)
