'use client'

// Spreadsheet preview — handles CSV / XLSX / XLS via the existing `xlsx`
// (SheetJS) dependency. Same approach as PdfPreview: render to plain HTML
// (<table>) so the URL never enters the DOM, the parent dialog's
// `onContextMenu` block applies, and we can be dynamic + ssr:false to
// keep the bundle out of the server build.
//
// We don't use react-table or DataGrid here — chat-attached spreadsheets
// are typically small (lab reports, summary rows). Plain MUI Table keeps
// the dialog snappy.

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import * as XLSX from 'xlsx'

interface Props {
  url: string
  filename: string
  /** Reset state when the previewed attachment changes. */
  attachmentId?: string
}

type Sheet = { name: string; rows: (string | number)[][] }

const SpreadsheetPreview = ({ url, filename, attachmentId }: Props) => {
  const [sheets, setSheets] = useState<Sheet[] | null>(null)
  const [activeSheet, setActiveSheet] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSheets(null)
    setError(null)
    setActiveSheet(0)

    // CSV files come back as text; XLSX/XLS as binary. We fetch as
    // ArrayBuffer either way and let SheetJS detect the format.
    const isCsv = /\.csv$/i.test(filename)

    fetch(url)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)

        return isCsv ? ((await r.text()) as string | ArrayBuffer) : await r.arrayBuffer()
      })
      .then(data => {
        if (cancelled) return
        const wb = XLSX.read(data, { type: isCsv ? 'string' : 'array' })
        const parsed: Sheet[] = wb.SheetNames.map(name => ({
          name,
          rows: XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[name], {
            header: 1,
            defval: '',
            blankrows: false
          })
        }))
        setSheets(parsed)
      })
      .catch(err => {
        if (cancelled) return
        // eslint-disable-next-line no-console
        console.error('[chat:spreadsheet] failed to load:', err)
        setError('Failed to load file')
      })

    return () => {
      cancelled = true
    }
  }, [url, filename, attachmentId])

  if (error) {
    return (
      <Typography sx={{ color: 'common.white', my: 4 }}>{error}</Typography>
    )
  }

  if (!sheets) {
    return <CircularProgress size={32} sx={{ color: 'common.white', my: 4 }} />
  }

  const sheet = sheets[activeSheet]
  if (!sheet) return null

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1100,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'common.white',
        borderRadius: 1,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onContextMenu={(e: any) => e.preventDefault()}
    >
      {sheets.length > 1 ? (
        <Tabs
          value={activeSheet}
          onChange={(_, v) => setActiveSheet(v)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 36 }}
        >
          {sheets.map((s, i) => (
            <Tab key={s.name} label={s.name} value={i} sx={{ minHeight: 36, py: 0.5 }} />
          ))}
        </Tabs>
      ) : null}
      <TableContainer sx={{ maxHeight: '70vh' }}>
        <Table size='small' stickyHeader>
          <TableBody>
            {sheet.rows.map((row, rIdx) => (
              <TableRow key={rIdx} hover={rIdx > 0}>
                {row.map((cell, cIdx) => (
                  <TableCell
                    key={cIdx}
                    sx={{
                      borderRight: 1,
                      borderColor: 'divider',
                      fontWeight: rIdx === 0 ? 600 : 400,
                      bgcolor: rIdx === 0 ? 'grey.100' : undefined,
                      whiteSpace: 'pre-wrap',
                      verticalAlign: 'top'
                    }}
                  >
                    {String(cell ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SpreadsheetPreview
