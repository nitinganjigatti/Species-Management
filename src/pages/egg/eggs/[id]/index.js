import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import EggFirstSection from 'src/views/pages/egg/eggs/eggDetails/EggFirstSection'
import EggSecondSecion from 'src/views/pages/egg/eggs/eggDetails/EggSecondSecion'
import { GetEggDetails } from 'src/lib/api/egg/egg'
import EggImageGallery from 'src/views/pages/egg/eggs/eggDetails/EggImageGallery'
import EggComment from 'src/views/pages/egg/eggs/eggDetails/EggComment'
import { useRouter } from 'next/router'
import { CircularProgress } from '@mui/material'

const EggDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const [eggDetails, setEggDetails] = useState({})
  const [loader, setLoader] = useState(false)

  const getDetails = id => {
    setLoader(true)
    try {
      GetEggDetails(id).then(res => {
        if (res.success) {
          setEggDetails(res?.data)
          setLoader(false)
        } else {
          setLoader(false)
        }
      })
    } catch (error) {
      setLoader(false)
      console.log('error', error)
    }
  }

  useEffect(() => {
    getDetails(id)
  }, [])

  return (
    <>
      {/* {loader ? (
        <CircularProgress />
      ) : ( */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <EggFirstSection eggDetails={eggDetails} />
        <EggSecondSecion eggDetails={eggDetails} egg_id={id} />
        <EggImageGallery eggDetails={eggDetails} eggId={id} />
        <EggComment eggDetails={eggDetails} eggId={id} />
      </Box>
      {/* )} */}
    </>
  )
}

export default EggDetail
