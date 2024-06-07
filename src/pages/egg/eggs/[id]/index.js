import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import EggFirstSection from 'src/views/pages/egg/eggs/eggDetails/EggFirstSection'
import EggSecondSecion from 'src/views/pages/egg/eggs/eggDetails/EggSecondSecion'
import { GetEggDetails } from 'src/lib/api/egg/egg'
import EggImageGallery from 'src/views/pages/egg/eggs/eggDetails/EggImageGallery'
import EggComment from 'src/views/pages/egg/eggs/eggDetails/EggComment'

const EggDetail = () => {
  const [eggDetails, setEggDetails] = useState({})

  const getDetails = id => {
    try {
      GetEggDetails(id).then(res => {
        if (res.success) {
          setEggDetails(res?.data)
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    getDetails(2)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <EggFirstSection eggDetails={eggDetails} />
      <EggSecondSecion eggDetails={eggDetails} />
      <EggImageGallery eggDetails={eggDetails} />
      <EggComment eggDetails={eggDetails} />
    </Box>
  )
}

export default EggDetail
