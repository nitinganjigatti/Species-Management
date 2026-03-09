import React from 'react'
import { Grid, Box, Typography, IconButton, Tooltip } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useTheme } from '@emotion/react'
import Image from 'next/image'

interface EnclosureData {
  enclusreId?: string
  enclusreType?: string
  sectionName?: string
  siteName?: string
}

interface EnclosureDetailsCardProps {
  enclosureData: EnclosureData | null
  onEditClick?: () => void
}

interface InfoItem {
  icon: string
  label: string
  value: string
}

const EnclosureDetailsCard: React.FC<EnclosureDetailsCardProps> = ({ enclosureData, onEditClick }) => {
  const theme = useTheme() as any

  const info: InfoItem[] = [
    {
      icon: '/images/housing/enclosure-icon-colored.svg',
      label: 'Enclosure Name',
      value: `${enclosureData?.enclusreId}`
    },
    {
      icon: '/images/housing/enclosre-type-colored-icon.svg',
      label: 'Enclosure Type',
      value: `${enclosureData?.enclusreType}`
    },
    {
      icon: '/images/housing/section-colored-icon.svg',
      label: 'Section Name',
      value: `${enclosureData?.sectionName}`
    },
    {
      icon: '/images/housing/site-icon-colored.svg',
      label: 'Site Name',
      value: `${enclosureData?.siteName}`
    }
  ]

  return (
    <Box
      sx={{
        background: theme.palette.customColors.displaybgPrimary,
        borderRadius: 1,
        p: { xs: 2, sm: '24px' },
        width: '100%',
        boxSizing: 'border-box',
        mt: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          sx={{
            color: 'customColors.OnSurfaceVariant',
            lineHeight: 1,
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0
          }}
        >
          Enclosure Details
        </Typography>
        {/* <IconButton sx={{ p: 1 }} onClick={onEditClick}>
          <EditOutlinedIcon sx={{ fontSize: '24px', color: '#6b7a7a' }} />
        </IconButton> */}
      </Box>

      {/* Info Blocks */}
      <Grid container alignItems='center' justifyContent='flex-start' spacing={'24px'}>
        {info.map((item, idx) => (
          <Grid
            key={item.label}
            size={{ xs: 12, sm: 6, md: 3 }}
            sx={{
              display: 'flex',
              gap: '8px',
              pr: 2,
              alignItems: 'center',
              borderRight: {
                xs: 'none',
                sm: idx % 2 === 1 ? 'none' : '0.5px solid #006D354D',
                md: info.length === idx + 1 ? 'none' : '0.5px solid #006D354D'
              },
              minWidth: 0
            }}
          >
            <Image
              height={32}
              width={32}
              src={item.icon}
              alt='Cluster Icon'
              style={{ height: '32px', width: '32px' }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <Tooltip title={item.label}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.secondaryBg,
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.label}
                </Typography>
              </Tooltip>
              <Tooltip title={item.value}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontWeight: 600,
                    fontSize: '14px',
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.value ? item.value : 'NA'}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default EnclosureDetailsCard
