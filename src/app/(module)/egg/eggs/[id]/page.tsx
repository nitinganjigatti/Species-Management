'use client'
import useSafeRouter from 'src/hooks/useSafeRouter'
import type { FC } from 'react'
import type { EggItem } from 'src/types/egg'
import React, { useEffect, useState, useContext } from 'react'

import { Box } from '@mui/system'
import { Breadcrumbs, Typography } from '@mui/material'

import { assessment_type_string_id } from 'src/constants/Constants'
import { AuthContext } from 'src/context/AuthContext'

import FallbackSpinner from 'src/@core/components/spinner'
import ErrorScreen from 'src/pages/Error'

import EggHeroSection from 'src/views/pages/egg/eggs/eggDetails/EggHeroSection'
import EggSecondSecion from 'src/views/pages/egg/eggs/eggDetails/EggSecondSecion'
import AnimalDetails from 'src/views/pages/egg/eggs/eggDetails/AnimalDetails'
import EggImageGallery from 'src/views/pages/egg/eggs/eggDetails/EggImageGallery'
import EggComment from 'src/views/pages/egg/eggs/eggDetails/EggComment'
import { useTranslation } from 'react-i18next'

import { GetEggDetails, getActivityLogs, getDefaultEggAssesment, getGalleryImgList } from 'src/lib/api/egg/egg'

const EggDetail: FC = () => {
  const router = useSafeRouter()
  const { t } = useTranslation()
  const { id } = router.query as { id?: string | string[] }
  const authData = useContext(AuthContext) as any
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [queryParams, setQueryParams] = useState<Record<string, any>>({})
  const [loader, setLoader] = useState<boolean>(true)
  const [eggDetails, setEggDetails] = useState<any>({})

  const [galleryList, setGalleryList] = useState<any[]>([])
  const [defaultEggAssesment, setDefaultEggAssesment] = useState<any>({})
  const [activtyLogCount, setActivtyLogCount] = useState<number>(0)
  const [activtyLogData, setActivtyLogData] = useState<any[]>([])

  useEffect(() => {
    if (router.query) {
      setQueryParams(router.query as Record<string, any>)
    }
  }, [router.query])

  useEffect(() => {
    const handlePopState = (): void => {
      if (window.location.pathname.startsWith('/egg/eggs') && !window.location.pathname.includes('/eggs/')) {
        router.push({
          pathname: '/egg/eggs',
          query: queryParams
        })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router, queryParams])

  const GetGalleryImgListFunc = async (): Promise<void> => {
    try {
      const validId = Array.isArray(id) ? id[0] : id
      if (!validId) return

      const res: any = await getGalleryImgList({ ref_id: validId, ref_type: 'egg' })
      if (res.success) {
        setGalleryList(res?.data?.result)
      }
    } catch (error) {
      console.error('error', error)
    }
  }

  const getDetails = async (eggId?: string | number): Promise<void> => {
    const validId = typeof eggId === 'string' ? eggId : eggId
    if (!validId) return

    try {
      const res: any = await GetEggDetails(validId)
      if (res.success) {
        setEggDetails(res?.data)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      console.error('error', error)
    }
  }

  const getDefaultEggAssesmentFunc = async (): Promise<void> => {
    try {
      const res: any = await getDefaultEggAssesment()
      if (res.success) {
        setDefaultEggAssesment(res?.data?.find((item: any) => item.assessment_type_string_id === assessment_type_string_id))
      }
    } catch (error) {
      console.error('error', error)
    }
  }

  const getActivityLogsFunc = async (): Promise<void> => {
    // Convert id to string: handle array by taking first element, skip if undefined
    const validId = Array.isArray(id) ? id[0] : id
    if (!validId) return

    const params = { page_no: 1 }
    try {
      const res: any = await getActivityLogs(validId, params)
      if (res.success) {
        setActivtyLogData(res?.data?.result)
        setActivtyLogCount(res?.data?.total_count)
      }
    } catch (error) {
      console.error('error', error)
    }
  }

  useEffect(() => {
    if (egg_collection_permission) {
      const validId = Array.isArray(id) ? id[0] : id
      if (validId) {
        getDetails(validId)
      }
      getDefaultEggAssesmentFunc()
      GetGalleryImgListFunc()
      getActivityLogsFunc()
    }
  }, [])

  const handleBackButton = (): void => {
    router.push({
      pathname: '/egg/eggs',
      query: queryParams
    })
  }

  return (
    <>
      {egg_collection_permission ? (
        loader ? (
          // @ts-ignore - FallbackSpinner component type mismatch (external library)
          <FallbackSpinner />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Typography color='inherit'>Egg</Typography>
              <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => handleBackButton()}>
                {t('egg_module.egg_list')}
              </Typography>
              <Typography
                sx={{
                  color: 'text.primary'
                }}
              >
                {t('egg_module.egg_details')}
              </Typography>
            </Breadcrumbs>
            <EggHeroSection
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
              egg_id={Array.isArray(id) ? id[0] : id}
              activtyLogData={activtyLogData}
              setActivtyLogData={setActivtyLogData}
              activtyLogCount={activtyLogCount}
              setActivtyLogCount={setActivtyLogCount}
            />
            <EggImageGallery galleryList={galleryList} />
            <EggComment eggDetails={eggDetails} eggId={Array.isArray(id) ? id[0] : id} />
          </Box>
        )
      ) : (
        <ErrorScreen></ErrorScreen>
      )}
    </>
  )
}

export default EggDetail
