import { Box } from '@mui/system'
import React, { useEffect, useState, useContext } from 'react'
import EggFirstSection from 'src/views/pages/egg/eggs/eggDetails/EggFirstSection'
import EggSecondSecion from 'src/views/pages/egg/eggs/eggDetails/EggSecondSecion'
import { GetEggDetails, getActivityLogs, getDefaultEggAssesment } from 'src/lib/api/egg/egg'
import EggImageGallery from 'src/views/pages/egg/eggs/eggDetails/EggImageGallery'
import EggComment from 'src/views/pages/egg/eggs/eggDetails/EggComment'
import Router, { useRouter } from 'next/router'
import { assessment_type_string_id } from 'src/constants/Constants'
import FallbackSpinner from 'src/@core/components/spinner'
import { Breadcrumbs, Typography } from '@mui/material'
import { getGalleryImgList } from 'src/lib/api/egg/egg'
import AnimalDetails from 'src/views/pages/egg/eggs/eggDetails/AnimalDetails'

import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'

const EggDetail = () => {
  const router = useRouter()
  const { id } = router.query

  const [eggDetails, setEggDetails] = useState({})
  const [defaultEggAssesment, setDefaultEggAssesment] = useState({})
  const [loader, setLoader] = useState(true)

  const [galleryList, setGalleryList] = useState([])

  const [activtyLogData, setActivtyLogData] = useState([])
  const [activtyLogCount, setActivtyLogCount] = useState(0)

  const authData = useContext(AuthContext)
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module
  const [queryParams, setQueryParams] = useState({})

  // console.log('queryParams :>> ', queryParams)

  useEffect(() => {
    if (router.query) {
      setQueryParams(router.query)
    }

    router.beforePopState(({ url, as, options }) => {
      // Intercept the back button and append query parameters
      if (as.startsWith('/egg/eggs')) {
        router.push({
          pathname: '/egg/eggs',
          query: queryParams
        })

        return false // Prevent the default back action
      }

      return true
    })

    return () => {
      // Clean up the beforePopState event
      router.beforePopState(() => true)
    }
  }, [router, queryParams])

  const GetGalleryImgListFunc = () => {
    try {
      getGalleryImgList({ ref_id: id, ref_type: 'egg' }).then(res => {
        if (res.success) {
          setGalleryList(res?.data?.result)
        } else {
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

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

  const getActivityLogsFunc = () => {
    const params = { page_no: 1 }
    try {
      getActivityLogs(id, params).then(res => {
        if (res.success) {
          setActivtyLogData(res?.data?.result)
          setActivtyLogCount(res?.data?.total_count)
        } else {
        }
      })
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    if (egg_collection_permission) {
      getDetails(id)
      getDefaultEggAssesmentFunc()
      GetGalleryImgListFunc()
      getActivityLogsFunc()
    }
  }, [])

  const handleBackButton = () => {
    router.push({
      pathname: '/egg/eggs',
      query: queryParams
    })
  }

  return (
    <>
      {egg_collection_permission ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography color='inherit'>Egg</Typography>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => handleBackButton()}>
                Egg List
              </Typography>
              <Typography color='text.primary'>Egg Details</Typography>
            </Breadcrumbs>
            <EggFirstSection
              getActivityLogsFunc={getActivityLogsFunc}
              GetGalleryImgList={GetGalleryImgListFunc}
              getDetails={getDetails}
              eggDetails={eggDetails}
              handleBackButton={handleBackButton}
            />
            {eggDetails?.animal_data?.animal_id && <AnimalDetails eggDetails={eggDetails} />}
            <EggSecondSecion
              getDetails={getDetails}
              eggDetails={eggDetails}
              defaultEggAssesment={defaultEggAssesment}
              egg_id={id}
              activtyLogData={activtyLogData}
              setActivtyLogData={setActivtyLogData}
              activtyLogCount={activtyLogCount}
              setActivtyLogCount={setActivtyLogCount}
            />
            <EggImageGallery galleryList={galleryList} />
            <EggComment eggDetails={eggDetails} eggId={id} />
          </Box>
        )
      ) : (
        <ErrorScreen></ErrorScreen>
      )}
    </>
  )
}

export default EggDetail
