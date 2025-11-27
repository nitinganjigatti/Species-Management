import React from 'react'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/system'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { useFormContext } from 'react-hook-form'

export default function AttachmentsSection({ sectionId }) {
  const { control, setValue, watch } = useFormContext()
  const files = watch(`${sectionId}.files`) || []

  const handleFileChange = newFiles => {
    setValue(`${sectionId}.files`, newFiles)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ControlledMultiFileUpload
        name={`${sectionId}.files`}
        control={control}
        value={files}
        onChange={handleFileChange}
        label='Upload attachment'
        acceptedFileTypes={'images,pdf,document'}
      />
    </Box>
  )
}
