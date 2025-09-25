import React, { useState } from 'react'
import { useTheme } from '@emotion/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  const { animal_id } = router.query

  const params = {
    type: 'all',
    page_no: 1,
    medical_type: 'clinical_notes'
  }

  //  Fetch clinical notes for a specific animal based on the ID from URL params
  const {
    data: clinicalNotesData,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['clinicalNotes', animal_id, params],
    queryFn: () => getClinicalNotes({ animalId: animal_id, params }),
    select: res => res?.data?.result || [],
    enabled: !!animal_id,
    refetchOnWindowFocus: false, //Avoid unnecessary refetching when switching tabs
    onError: error => {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch data' })
    }
  })

  // Handle submission of new clinical notes
  const handleSubmitData = async payLoad => {
    setIsSubmitLoading(true)
    try {
      const response = await addClinicalNotes({ payLoad })

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Note created successfully' })
        await refetch()
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      console.error('Submit Error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Mutation for deleting a clinical note by ID
  const deleteClinicalNotesMutation = useMutation({
    mutationFn: noteId => deleteClinicalNotes(noteId),
    onSuccess: async response => {
      Toaster({ type: 'success', message: response?.message || 'Note deleted successfully' })

      queryClient.invalidateQueries(['clinicalNotes', animal_id])
      handleDeleteDialogClose()
    },
    onError: error => {
      console.error('Delete Error:', error)
      Toaster({ type: 'error', message: error?.message || 'An error occurred while deleting' })
    }
  })

  // Trigger delete dialog by selecting a note
  const handleDeleteNote = noteId => {
    const selectedNote = clinicalNotesData?.find(item => item?.note_id === noteId)

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
    if (!selectedItemToDelete?.note_id) return
    deleteClinicalNotesMutation.mutate(selectedItemToDelete?.note_id)
  }

  return (
    <>
      <InpatientClinicalNotes
        clinicalNotesData={clinicalNotesData}
        onSubmitNote={handleSubmitData}
        isSubmitting={isSubmitLoading}
        onDeleteNote={handleDeleteNote}
        isLoading={isFetching}
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
