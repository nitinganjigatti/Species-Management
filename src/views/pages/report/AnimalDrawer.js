import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  CircularProgress
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import { getAnimalListing } from 'src/lib/api/report'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'

const mockAnimals = [
  {
    id: 1,
    sex: 'female',
    default_icon: '/images/cat-swimming.png',
    // local_identifier_name: 'BI23000123',
    common_name: 'Peach Fronted Conure',
    scientific_name: 'Psittacus vibrans',
    user_enclosure_name: 'DT 2',
    section_name: 'Dain Tree',
    site_name: 'Gagava'
  },
  {
    id: 2,
    sex: 'male',
    default_icon: '/images/cat-swimming.png',
    // local_identifier_value: 'BI23000123',
    common_name: 'Peach Fronted Conure',
    scientific_name: 'Psittacus vibrans',
    user_enclosure_name: 'DT 2',
    section_name: 'Dain Tree',
    site_name: 'Gagava'
  },
  {
    id: 3,
    sex: 'male',
    default_icon: '/images/cat-swimming.png',
    // local_identifier_value: 'BI23000123',
    common_name: 'Peach Fronted Conure',
    scientific_name: 'Psittacus vibrans',
    user_enclosure_name: 'DT 2',
    section_name: 'Dain Tree',
    site_name: 'Gagava'
  },
  {
    id: 4,
    sex: 'indeterminate',
    default_icon: '/images/cat-swimming.png',
    // local_identifier_value: 'BI23000123',
    common_name: 'Peach Fronted Conure',
    scientific_name: 'Psittacus vibrans',
    user_enclosure_name: 'DT 2',
    section_name: 'Dain Tree',
    site_name: 'Gagava'
  }
]

// const AnimalCard = ({ animal, selectedAnimal, setSelectedAnimal, theme }) => (
//   <ListItem key={animal.id} sx={{ mt: 4, bgcolor: '#FFFFFF', borderRadius: '8px', boxShadow: 'none' }}>
//     <ListItemAvatar sx={{ mb: 20 }}>
//       <Avatar src={animal.image} alt={animal.name} />
//     </ListItemAvatar>

//     <ListItemText
//       primary={
//         <>
//           <Typography
//             sx={{
//               fontSize: '14px',
//               fontWeight: 600,
//               color: theme.palette.customColors.OnSurfaceVariant,
//               mt: 2
//             }}
//           >
//             AID: {animal.aid}
//           </Typography>
//           <Typography
//             sx={{
//               fontSize: '16px',
//               fontWeight: 600,
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             {animal.name}
//           </Typography>
//         </>
//       }
//       secondary={
//         <>
//           <Typography
//             sx={{
//               fontSize: '16px',
//               fontWeight: 400,
//               fontFamily: 'Inter',
//               fontStyle: 'italic',
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             {animal.sci}
//           </Typography>
//           <Typography
//             sx={{
//               fontSize: '14px',
//               fontWeight: 400,
//               fontStyle: 'italic',
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             Encl: {animal.encl}
//           </Typography>
//           <Typography
//             sx={{
//               fontSize: '14px',
//               fontWeight: 400,
//               fontStyle: 'italic',
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             Sec: {animal.sec}
//           </Typography>
//           <Typography
//             sx={{
//               fontSize: '14px',
//               fontWeight: 400,
//               fontStyle: 'italic',
//               color: theme.palette.customColors.OnSurfaceVariant
//             }}
//           >
//             Site: {animal.site}
//           </Typography>
//         </>
//       }
//     />

//     <Box display='flex' alignItems='center' gap={1}>
//       <Radio checked={selectedAnimal === animal.id} onChange={() => setSelectedAnimal(animal.id)} />
//     </Box>
//   </ListItem>
// )

const AnimalDrawer = ({ open, onClose }) => {
  const theme = useTheme()
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [animalList, setAnimalList] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchAnimalListing = async (page = 1) => {
    const PAGE_SIZE = 10
    setLoading(true)
    // setIsLoading(true)
    const params = {
      page: page,
      limit: PAGE_SIZE
    }
    const response = await getAnimalListing(params)
    const totalCount = response?.total_count || 0
    if (response.success) {
      setAnimalList(prev => [...prev, ...response.data])
      setLoading(false)
      setTotal(totalCount)
      // setIsLoading(false)
      setHasMore(response?.data?.length === PAGE_SIZE)
    } else {
      console.log('something is wrong', response?.error)
      setLoading(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnimalListing()
  }, [])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      debugger
      const nextPage = page + 1
      setPage(nextPage)
      fetchAnimalListing(nextPage)
    }
  }, [loading, hasMore, page])

  const loaderRef = useInfiniteScroll(loadMore, loading, hasMore)

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.customColors.bodyBg,
        gap: '24px'
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant,
              ml: 2
            }}
          >
            Select the Animal
          </Typography>
          <IconButton onClick={onClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
          <TextField
            fullWidth
            placeholder='Search by Animal name or Identifier'
            variant='outlined'
            size='small'
            slotProps={{
              startAdornment: <Icon icon='mdi:magnify' fontSize={20} />,
              style: { borderRadius: 8, border: '1px solid #C3CEC7', height: '50px' }
            }}
            // InputProps={{
            //   startAdornment: <Icon icon='mdi:magnify' fontSize={20} />,
            //   style: { borderRadius: 8, border: '1px solid #C3CEC7', height: '50px' }
            // }}
          />
          <IconButton sx={{ border: '1px solid #C3CEC7', borderRadius: '8px', height: '47px', width: '47px' }}>
            <Icon icon='mdi:tune-variant' />
          </IconButton>
        </Box>

        {loading ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%', // Ensure it fills available space
              bgcolor: theme.palette.customColors.bodyBg // Optional: match the drawer background
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              bgcolor: theme.palette.customColors.bodyBg,
              mt: 6,
              p: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            {animalList.map(animal => (
              <AnimalParentCard
                key={animal.animal_id}
                data={animal}
                style
                radio={{
                  checked: selectedAnimal === animal.animal_id,
                  onChange: () => setSelectedAnimal(animal.animal_id)
                }}
              />
            ))}
            {/* 🔹  Invisible sentinel */}
            {!loading && animalList.length === 0 && (
              <Box display='flex' justifyContent='center' py={2}>
                <CircularProgress />
              </Box>
            )}

            {(!loading || hasMore) && animalList.length > 0 && (
              <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                <CircularProgress />
              </Box>
            )}

            {!loading && animalList.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
                No custom species found
              </Typography>
            )}

            {!hasMore && animalList.length > 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                No more species to load
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default AnimalDrawer
