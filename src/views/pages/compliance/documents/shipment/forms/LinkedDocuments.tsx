import React, { useState } from 'react'
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon, Collapse } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

interface DocumentItem {
  document_type_name?: string
  file_path?: string
  file_original_name?: string
  [key: string]: unknown
}

interface LinkedItem {
  export_id?: string | number
  import_id?: string | number
  export_number?: string
  import_number?: string
  documents?: DocumentItem[]
  [key: string]: unknown
}

interface SectionBlockProps {
  title: string
  type: string
  data: LinkedItem[]
}

interface LinkedDocumentsData {
  exports?: LinkedItem[]
  imports?: LinkedItem[]
}

interface LinkedDocumentsProps {
  linkedDocumentsData: LinkedDocumentsData
}

const SectionBlock = ({ title, type, data }: SectionBlockProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<boolean>(false)
  const theme = useTheme()

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        borderRadius: 1,
        mb: 5,
        overflow: 'hidden'
      }}
    >
      <Box
        onClick={() => (data?.length > 0 ? setExpanded(!expanded) : null)}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.palette.customColors.tableHeaderBg,
          px: 4,
          py: 2.8,
          cursor: data?.length > 0 ? 'pointer' : 'default'
        }}
      >
        <Typography fontWeight={500}>
          {title} {data?.length || 0}
        </Typography>

        {data?.length > 0 && (
          <Box display='flex' alignItems='center' gap={1}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#16825D', mr: 2 }}>
              {expanded ? t('compliance_module.collapse') : t('compliance_module.expand')}
            </Typography>
            <img src={expanded ? '/icons/collapse.svg' : '/icons/expand.svg'} alt='toggle' width='24px' height='24px' />
          </Box>
        )}
      </Box>

      {data?.map(item => (
        <Box
          key={item.export_id}
          sx={{
            background: expanded ? theme.palette.customColors.lightBg : theme.palette.common.white,
            borderTop: '1px solid #eee',
            pt: 3.5
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: expanded ? 3 : 3,
              px: 4
            }}
          >
            <Typography
              sx={{ fontWeight: 500, color: theme.palette.primary.dark, cursor: 'pointer' }}
              onClick={() => {
                if (item?.export_number) {
                  window.open(`/compliance/documents/exports/${item?.export_id}/?id=${item?.export_id}`, '_blank')
                } else if (item?.import_number) {
                  window.open(
                    `/compliance/documents/imports/AddEditImport/?id=${item?.import_id}&action=details`,
                    '_blank'
                  )
                }
              }}
            >
              {type} ID: {item.export_number || item.import_number}
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                backgroundColor: theme.palette.common.white,
                padding: '2px 8px',
                borderRadius: '4px',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              <strong>{item.documents?.length || 0}</strong> {item.documents?.length == 1 ? 'Document' : 'Documents'}
            </Typography>
          </Box>

          <Collapse in={expanded}>
            <List disablePadding>
              {(item.documents || []).map((doc, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 4,
                    py: 2.5,
                    borderBottom: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                    background: theme.palette.common.white
                  }}
                >
                  <ListItemText primary={doc.document_type_name} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <DescriptionOutlinedIcon sx={{ color: '#16825D' }} />
                    </ListItemIcon>
                    <a
                      href={doc.file_path}
                      target='_blank'
                      style={{ color: '#16825D', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {doc.file_original_name}
                    </a>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      ))}
    </Box>
  )
}

const LinkedDocuments = ({ linkedDocumentsData }: LinkedDocumentsProps) => {
  return (
    <Box sx={{ mt: 0 }}>
      {(linkedDocumentsData.exports?.length ?? 0) > 0 && (
        <SectionBlock title='Exports' type='Export' data={linkedDocumentsData.exports ?? []} />
      )}
      {(linkedDocumentsData.imports?.length ?? 0) > 0 && (
        <SectionBlock title='Imports' type='Import' data={linkedDocumentsData.imports ?? []} />
      )}
    </Box>
  )
}

export default LinkedDocuments
