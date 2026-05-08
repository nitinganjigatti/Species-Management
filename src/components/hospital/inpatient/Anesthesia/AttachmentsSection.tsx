import React from 'react'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/system'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface AttachmentsSectionProps {
  sectionId: string
}

export default function AttachmentsSection({ sectionId }: AttachmentsSectionProps) {
  const { control, setValue, watch } = useFormContext()
  const { t } = useTranslation()
  const files: any[] = (watch(`${sectionId}.files`) as any) || []

  const handleFileChange = (newFiles: any[]) => {
    setValue(`${sectionId}.files`, newFiles)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ControlledMultiFileUpload
        name={`${sectionId}.files`}
        control={control}
        value={files}
        onChange={handleFileChange}
        label={(t('hospital_module.upload_attachment') as string)}
        acceptedFileTypes={'images,pdf,document'}
      />
    </Box>
  )
}
