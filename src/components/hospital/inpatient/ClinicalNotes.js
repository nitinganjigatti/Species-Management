import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Toaster } from 'react-hot-toast'
import { getClinicalNotes } from 'src/lib/api/hospital/clinicalNotesApi'

// ** View Component
import InpatientClinicalNotes from 'src/views/pages/hospital/inpatient/InpatientClinicalNotes'

const ClinicalNotes = () => {
  const params = {
    type: 'all',
    page_no: 1,
    medical_type: 'clinical_notes'
  }

  const { data, isFetching } = useQuery({
    queryKey: ['clinicalNotes', params],
    queryFn: () => getClinicalNotes({ params }),
    select: res => res?.data?.result || [],
    keepPreviousData: true,
    staleTime: 1 * 60 * 1000, // cache for 1 minutes
    onError: error => {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch data' })
    }
  })

  return (
    <InpatientClinicalNotes
      clinicalNotesData={data}
      handleSubmitData={() => {}}
      onDeleteNote={() => {}}
      loading={isFetching}
    />
  )
}

export default React.memo(ClinicalNotes)
