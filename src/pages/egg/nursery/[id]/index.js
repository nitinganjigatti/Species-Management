import { Card, CardContent, CardHeader, Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import DetailCard from 'src/components/egg/DetailCard'
import { GetNurseryDetailsById } from 'src/lib/api/egg/nursery'

const NurseryDetails = () => {
  const [nurseryData, setNurseryData] = useState({})
  const [editName, setEditName] = useState('')
  const [editSite, setEditSite] = useState('')
  const [editNurseryId, setEditNurseryId] = useState(null)

  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    const fetchNurseryById = async () => {
      const response = await GetNurseryDetailsById(id)
      setNurseryData(response?.data)
      setEditNurseryId(id)
      setEditName(response.data?.nursery_name)
      setEditSite(response?.data?.site_id)
    }
    fetchNurseryById()
  }, [])

  console.log('Id >>', editNurseryId)

  return (
    <>
      <DetailCard
        title='Nursery Details'
        ButtonName={'ADD ROOM'}
        nurseryData={nurseryData}
        editName={editName}
        editNurseryId={editNurseryId}
        editSite={editSite}
      />
    </>
  )
}

export default NurseryDetails
