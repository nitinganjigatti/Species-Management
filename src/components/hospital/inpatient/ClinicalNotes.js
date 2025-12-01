import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useTheme } from '@emotion/react'
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import { addClinicalNotes, deleteClinicalNotes, getClinicalNotes } from 'src/lib/api/hospital/clinicalNotesApi'
import InpatientClinicalNotes from 'src/views/pages/hospital/inpatient/InpatientClinicalNotes'

const ClinicalNotes = ({ patientData }) => {
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const router = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()

  const { id } = router.query
  const animalId = patientData?.animal_detail?.animal_id

  // Query parameters for fetching clinical notes
  const queryParams = useMemo(
    () => ({
      type: 'all',
      limit: 10,
      hospital_case_id: id,
      medical_type: 'clinical_notes'
    }),
    []
  )

  // Fetch clinical notes with pagination
  const fetchClinicalNotes = async ({ pageParam = 1 }) => {
    try {
      const res = await getClinicalNotes({
        animalId: animalId,
        params: { ...queryParams, page: pageParam }
      })

      return {
        total_count: res?.data?.total_count,
        data: res?.data?.result || []
      }
    } catch (error) {
      console.error('Error fetching clinical notes:', error?.message)
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
      })
    }
  }

  // Pagination function for infinite scroll
  const getNextPage = (lastPage, pages) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages?.reduce((sum, page) => sum + (page?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages?.length + 1 : undefined
  }

  //  Fetch clinical notes
  const {
    data: clinicalNotesData = [],
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['clinicalNotes', animalId, queryParams],
    queryFn: fetchClinicalNotes,
    getNextPageParam: getNextPage,
    enabled: !!animalId,
    refetchOnWindowFocus: false, //Avoid unnecessary refetching when switching tabs
    onError: error => {
      console.error('Fetching Error:', error?.message)
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch data' })
    }
  })

  // Combine all pages of data
  const allClinicalEntries = useMemo(() => {
    return clinicalNotesData?.pages?.flatMap(page => page?.data || []) || []
  }, [clinicalNotesData])

  // infinite scroll observer
  const observer = useRef()

  const lastClinicalNoteRef = useCallback(
    node => {
      if (isFetchingNextPage || !hasNextPage) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })

      if (node) observer.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  // Handle submission of new clinical notes
  const handleSubmitData = async payload => {
    setIsSubmitLoading(true)
    try {
      const response = await addClinicalNotes({ payload })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Note added successfully' })
        queryClient.invalidateQueries(['clinicalNotes'])

        return true
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })

        return false
      }
    } catch (error) {
      console.error('Submit Error:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })

      return false
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Mutation for deleting a clinical note by ID
  const deleteClinicalNotesMutation = useMutation({
    mutationFn: noteId => deleteClinicalNotes(noteId),
    onSuccess: async response => {
      Toaster({ type: 'success', message: response?.message || 'Note deleted successfully' })

      queryClient.invalidateQueries(['clinicalNotes'])
      handleDeleteDialogClose()
    },
    onError: error => {
      console.error('Delete Error:', error?.message || error)
      Toaster({ type: 'error', message: error?.message || 'An error occurred while deleting' })
    }
  })

  // Trigger delete dialog by selecting a note
  const handleDeleteNote = noteId => {
    const selectedNote = allClinicalEntries?.find(item => item?.note_id === noteId)

    if (selectedNote?.note_id) {
      setSelectedItemToDelete(selectedNote)
      setIsDeleteDialogOpen(true)
    }
  }

  //  Close delete confirmation dialog
  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setSelectedItemToDelete(null)
  }

  // Confirm and proceed with deletion
  const handleConfirmDeleteNote = () => {
    if (selectedItemToDelete?.note_id) {
      deleteClinicalNotesMutation.mutate(selectedItemToDelete.note_id)
    }
  }

  return (
    <>
      <InpatientClinicalNotes
        clinicalNotesData={allClinicalEntries}
        onSubmitNote={handleSubmitData}
        isSubmitting={isSubmitLoading}
        onDeleteNote={handleDeleteNote}
        isLoading={isFetching && allClinicalEntries?.length === 0}
        lastClinicalNoteRef={lastClinicalNoteRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        patientData={patientData}
      />

      {/* Confirmation Dialog for Deleting a Clinical Note */}
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isDeleteDialogOpen}
          onClose={handleDeleteDialogClose}
          title={'Delete Clinical Note?'}
          cancelText={'CANCEL'}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleConfirmDeleteNote}
          loading={deleteClinicalNotesMutation.isPending}
          ConfirmationText={'DELETE'}
          description={'Are you sure you want to permanently delete this Clinical Note?'}
        />
      )}
    </>
  )
}

export default ClinicalNotes
