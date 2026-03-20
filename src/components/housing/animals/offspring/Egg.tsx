import React, { FC, useEffect, useMemo, useState } from 'react'
import { Box, CircularProgress, useTheme } from '@mui/material'
import debounce from 'lodash/debounce'

import { TabProps, AnimalItem } from 'src/types/housing/animalsOffspring'
import { getClutchEggList } from 'src/lib/api/housing'

import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import EggCard from './EggCard'
import EggDrawer from './EggDrawer'

const Egg: FC<TabProps> = (props) => {
  const theme = useTheme() as any

  const [searchInput, setSearchInput] = useState('')
  const [searchEgg, setSearchEgg] = useState('')
  const [eggData, setEggData] = useState<AnimalItem[] | null>(null)
  const [isEggFetching, setIsEggFetching] = useState(false)
  const [eggDrawerOpen, setEggDrawerOpen] = useState<boolean>(false)
  const [selectedEgg, setSelectedEgg] = useState<AnimalItem | null>(null)

  const debouncedSearch = useMemo(() => debounce(setSearchEgg, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const fetchEggList = async () => {
    setIsEggFetching(true)

    try {
      const response = await getClutchEggList({
        type: 'offspring',
        q: searchEgg,
        parent_id: props.animalId,
        is_mother: 1,
        page_no: 1
      })

      if (response?.success) {
        setEggData(response?.data?.result || [])
      } else {
        setEggData([])
      }
    } catch (error) {
      console.error(error)
      setEggData([])
    } finally {
      setIsEggFetching(false)
    }
  }

   const handleEggDrawerClose = () => {
    setEggDrawerOpen(false)
    setSelectedEgg(null)
  }

  useEffect(() => {
    fetchEggList()
  }, [searchEgg])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setSearchInput('')
    setSearchEgg('')
  }

  return (
    <>
      <Box sx={{py: 4, px: 4 ,display:'flex',justifyContent:'flex-end'}}>
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
          eggData?.map(item => (
            <EggCard
              key={item.egg_id}
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
              handleEggClick={() => {
                setSelectedEgg(item)
                setEggDrawerOpen(true)
              }}
            />
          ))
        )}
      </Box>
      {
        eggDrawerOpen && <EggDrawer
          open={eggDrawerOpen}
          onClose={handleEggDrawerClose}
          eggDetails={selectedEgg}
        />
      }
    </>
  )
}

export default React.memo(Egg)