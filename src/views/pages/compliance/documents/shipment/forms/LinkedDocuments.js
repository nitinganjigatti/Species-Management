import React, { useState } from 'react'
import { Typography, Box, List, ListItem, ListItemText, ListItemIcon, Collapse } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'

const SectionBlock = ({ title, type, data }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Box
      sx={{
        border: '1px solid #C3CEC7',
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
          background: '#E8F4F2',
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
              {expanded ? 'Collapse' : 'Expand'}
            </Typography>
            <img src={expanded ? '/icons/collapse.svg' : '/icons/expand.svg'} alt='toggle' width='24px' height='24px' />
          </Box>
        )}
      </Box>

      {data?.map(item => (
        <Box
          key={item.export_id}
          sx={{ background: expanded ? '#EFF5F2' : '#fff', borderTop: '1px solid #eee', pt: 3.5 }}
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
            <Typography sx={{ fontWeight: 500, color: '#006D35' }}>
              {type} ID: {item.export_id || item.import_id}
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                backgroundColor: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                color: '#44544A'
              }}
            >
              <strong>{item.documents?.length || 0}</strong> {item.documents?.length == 1 ? 'Document' : 'Documents'}
            </Typography>
          </Box>

          <Collapse in={expanded}>
            <List disablePadding>
              {item.documents.map((doc, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 4,
                    py: 2.5,
                    borderBottom: '1px solid #0000000D',
                    background: '#fff'
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

const LinkedDocuments = ({ linkedDocumentsData }) => {
  return (
    <Box sx={{ mt: 0 }}>
      {linkedDocumentsData.exports?.length > 0 && (
        <SectionBlock title='Exports' type='Export' data={linkedDocumentsData.exports} />
      )}
      {linkedDocumentsData.imports?.length > 0 && (
        <SectionBlock title='Imports' type='Import' data={linkedDocumentsData.imports} />
      )}
    </Box>
  )
}

export default LinkedDocuments
