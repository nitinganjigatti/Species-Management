import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { getSpeciesBreakdown } from 'src/lib/api/compliance/matrix'

const shortCode = org => {
  if (org?.short_name) return org.short_name
  const name = org?.organization_name || ''
  return name.split(/[\s,/\-_()]+/).filter(Boolean).map(w => w[0]).join('').toUpperCase() || name.slice(0, 5).toUpperCase()
}

// Large image preview on thumbnail hover
export const ImagePreview = ({ src, commonName, scientificName, anchorEl }) => {
  if (!anchorEl || !src) return null
  const rect = anchorEl.getBoundingClientRect()
  const popW = 320, popH = 300
  let left = rect.right + 12
  if (left + popW > window.innerWidth - 8) left = Math.max(8, rect.left - popW - 12)
  let top = rect.top - 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - popH - 8
  if (top < 8) top = 8

  return createPortal(
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        zIndex: 1500,
        left,
        top,
        width: 320,
        borderRadius: 2,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      <Box
        component='img'
        src={src}
        alt={commonName}
        sx={{ width: '100%', height: 240, objectFit: 'cover', display: 'block', bgcolor: 'grey.100' }}
      />
      <Box sx={{ px: 1.5, pt: 1, pb: 1.25 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'customColors.OnSurfaceVariant', display: 'block' }}>
          {commonName}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: 'customColors.neutralSecondary', fontStyle: 'italic', display: 'block', mt: 0.25 }}>
          {scientificName}
        </Typography>
      </Box>
    </Paper>,
    document.body
  )
}

// Site × Org breakdown tooltip — fetches from /compliance/species-breakdown
export const SpeciesSiteTip = ({ taxonomyId, commonName, scientificName, anchorEl }) => {
  const tipRef = useRef(null)
  const [pos, setPos] = useState({ left: -9999, top: -9999 })

  const { data, isFetching } = useQuery({
    queryKey: ['compliance-species-breakdown', taxonomyId],
    queryFn: () => getSpeciesBreakdown({ taxonomy_id: taxonomyId }),
    enabled: Boolean(anchorEl && taxonomyId),
    staleTime: 60_000
  })

  const breakdown = data?.data ?? data ?? null

  useEffect(() => {
    if (!anchorEl || !tipRef.current) return
    const rect = anchorEl.getBoundingClientRect()
    const tipW = tipRef.current.offsetWidth || 360
    const tipH = tipRef.current.offsetHeight || 200
    let left = rect.right + 12
    if (left + tipW > window.innerWidth - 8) left = Math.max(8, rect.left - tipW - 12)
    let top = rect.top - 8
    if (top + tipH > window.innerHeight - 8) top = window.innerHeight - tipH - 8
    if (top < 8) top = 8
    setPos({ left, top })
  }, [anchorEl, breakdown, isFetching])

  if (!anchorEl) return null

  const orgs = breakdown?.orgs ?? []
  const sites = breakdown?.sites ?? []
  const total = breakdown?.total ?? 0

  // Compute per-org grand totals for footer
  const orgTotals = {}
  orgs.forEach(org => {
    orgTotals[String(org.organization_id)] = sites.reduce((acc, s) => acc + (s.by_org?.[String(org.organization_id)] || 0), 0)
  })

  // Only show orgs that have at least one animal
  const activeOrgs = orgs.filter(org => (orgTotals[String(org.organization_id)] || 0) > 0)

  return createPortal(
    <Paper
      ref={tipRef}
      elevation={4}
      sx={{
        position: 'fixed',
        zIndex: 1500,
        left: pos.left,
        top: pos.top,
        minWidth: 280,
        maxWidth: 480,
        maxHeight: 420,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none'
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'customColors.SurfaceVariant', bgcolor: 'grey.50', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'customColors.OnSurfaceVariant' }}>
          {commonName || breakdown?.common_name || '—'}
        </Typography>
        {(scientificName || breakdown?.scientific_name) && (
          <Typography sx={{ fontSize: 11.5, color: 'customColors.neutralSecondary', fontStyle: 'italic', display: 'block', mt: 0.25 }}>
            {scientificName || breakdown?.scientific_name}
          </Typography>
        )}
        <Typography sx={{ fontSize: 10.5, color: 'primary.dark', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, display: 'block', mt: 0.5 }}>
          Across all sites · {total} total
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {isFetching && !breakdown ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : sites.length === 0 ? (
          <Box sx={{ py: 2, px: 2, color: 'customColors.neutralSecondary', fontSize: 12.5 }}>No data</Box>
        ) : (
          <Table size='small' sx={{ tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={thSx}>Site ↓ &nbsp; Org →</TableCell>
                {activeOrgs.map(org => (
                  <TableCell key={org.organization_id} align='right' sx={thSx}>
                    {shortCode(org)}
                  </TableCell>
                ))}
                <TableCell align='right' sx={{ ...thSx, color: 'customColors.TertiaryDark' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map(site => (
                <TableRow key={site.site_id}>
                  <TableCell sx={tdSx}>{site.site_name}</TableCell>
                  {activeOrgs.map(org => {
                    const v = site.by_org?.[String(org.organization_id)] || 0
                    return (
                      <TableCell key={org.organization_id} align='right' sx={{ ...tdSx, fontWeight: v ? 700 : 400, color: v ? 'customColors.OnSurfaceVariant' : 'customColors.Outline' }}>
                        {v || '·'}
                      </TableCell>
                    )
                  })}
                  <TableCell align='right' sx={{ ...tdSx, fontWeight: 700, color: 'customColors.TertiaryDark' }}>
                    {site.total}
                  </TableCell>
                </TableRow>
              ))}
              {/* Footer totals */}
              <TableRow>
                <TableCell sx={{ ...tdSx, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'primary.dark', borderTop: '2px solid', borderColor: 'customColors.SurfaceVariant' }}>
                  Total
                </TableCell>
                {activeOrgs.map(org => (
                  <TableCell key={org.organization_id} align='right' sx={{ ...tdSx, fontWeight: 700, borderTop: '2px solid', borderColor: 'customColors.SurfaceVariant' }}>
                    {orgTotals[String(org.organization_id)] || 0}
                  </TableCell>
                ))}
                <TableCell align='right' sx={{ ...tdSx, fontWeight: 700, color: 'customColors.TertiaryDark', borderTop: '2px solid', borderColor: 'customColors.SurfaceVariant' }}>
                  {total}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Box>
    </Paper>,
    document.body
  )
}

const thSx = {
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'customColors.neutralSecondary',
  fontWeight: 600,
  py: 0.75,
  whiteSpace: 'nowrap',
  borderBottom: 1,
  borderColor: 'customColors.SurfaceVariant'
}

const tdSx = {
  fontSize: 13,
  color: 'customColors.OnSurfaceVariant',
  py: 0.75,
  whiteSpace: 'nowrap',
  borderColor: 'customColors.SurfaceVariant'
}
