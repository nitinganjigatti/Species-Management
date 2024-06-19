import { Box } from '@mui/system'
import React, { useEffect, useState } from 'react'
import EggFirstSection from 'src/views/pages/egg/eggs/eggDetails/EggFirstSection'
import EggSecondSecion from 'src/views/pages/egg/eggs/eggDetails/EggSecondSecion'
import { GetEggDetails, getDefaultEggAssesment } from 'src/lib/api/egg/egg'
import EggImageGallery from 'src/views/pages/egg/eggs/eggDetails/EggImageGallery'
import EggComment from 'src/views/pages/egg/eggs/eggDetails/EggComment'
import { useRouter } from 'next/router'
import { assessment_type_string_id } from 'src/constants/Constants'
import FallbackSpinner from 'src/@core/components/spinner'

const EggDetail = () => {
  const router = useRouter()
  const { id, fromPath } = router.query

  const [eggDetails, setEggDetails] = useState({})
  const [defaultEggAssesment, setDefaultEggAssesment] = useState({})
  const [loader, setLoader] = useState(true)

  const getDetails = id => {
    // setLoader(true)
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

  const getDefaultEggAssesmentFunc = () => {
    try {
      getDefaultEggAssesment().then(res => {
        if (res.success) {
          setDefaultEggAssesment(res?.data?.find(item => item.assessment_type_string_id === assessment_type_string_id))
        } else {
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    getDetails(id)
    getDefaultEggAssesmentFunc()
  }, [])

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <EggFirstSection eggDetails={eggDetails} fromPath={fromPath} />
          <EggSecondSecion
            getDetails={getDetails}
            eggDetails={eggDetails}
            defaultEggAssesment={defaultEggAssesment}
            egg_id={id}
          />
          <EggImageGallery eggDetails={eggDetails} eggId={id} />
          <EggComment eggDetails={eggDetails} eggId={id} />
        </Box>
      )}
    </>
  )
}

export default EggDetail
