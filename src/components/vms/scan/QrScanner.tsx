'use client'

import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useScanQr } from 'src/hooks/vms/useVmsScan'
import { AuthContext } from 'src/context/AuthContext'
import { usePassSearch } from 'src/hooks/vms/useVmsPasses'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_CONFIG } from 'src/constants/vms'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanState = 'scanning' | 'result' | 'error' | 'manual_search'

interface ScanResult {
  pass_id: string
  visitor_name: string
  department: string
  visitor_contact: string
  status: string
  time_in: string | null
  start_date: string
  end_date: string
}

// ─── StatusChip ──────────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const config = VMS_STATUS_CONFIG[status] ?? { label: status, color: '#616161', bgColor: '#F0F0F0' }

  return (
    <Chip
      size='small'
      label={config.label}
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        fontSize: '12px',
      }}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface QrScannerProps {
  defaultSite?: string
}

const QR_READER_ID = 'vms-qr-reader'

const QrScanner = ({ defaultSite = '' }: QrScannerProps) => {
  const router = useRouter()
  const theme = useTheme()

  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedSite, setSelectedSite] = useState<string>(defaultSite)
  const [cameraError, setCameraError] = useState<string>('')
  const authData = useContext(AuthContext)
  const sites = ((authData as any)?.userData?.user?.zoos?.[0]?.sites ?? [])
    .slice()
    .sort((a: any, b: any) => (a.site_name ?? '').localeCompare(b.site_name ?? ''))
    .map((s: any) => ({ value: String(s.site_id), label: s.site_name }))

  const scannerRef = useRef<any>(null)
  const isInitRef = useRef(false)

  const scanMutation = useScanQr()

  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResponse } = usePassSearch(debouncedQuery)

  // ── Start / Stop scanner ───────────────────────────────────────────────────

  const startScanner = useCallback(async () => {
    if (isInitRef.current || scannerRef.current) return

    const el = document.getElementById(QR_READER_ID)
    if (!el) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(QR_READER_ID)
      scannerRef.current = scanner
      isInitRef.current = true

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        decodedText => {
          scanner.pause(true)

          scanMutation.mutate(
            { qr_data: decodedText, site_id: selectedSite ? Number(selectedSite) : null },
            {
              onSuccess: response => {
                setScanResult({
                  pass_id: response.data.pass.pass_id,
                  visitor_name: response.data.pass.visitor_name,
                  department: response.data.pass.department,
                  visitor_contact: response.data.pass.visitor_contact,
                  status: response.data.pass.status,
                  time_in: response.data.pass.time_in,
                  start_date: response.data.pass.start_date,
                  end_date: response.data.pass.end_date,
                })
                setScanState('result')
              },
              onError: (error: any) => {
                setScanError(error?.response?.data?.message || 'Scan failed')
                setScanState('error')
              },
            }
          )
        },
        () => {}
      )

      setCameraError('')
    } catch (err: any) {
      console.error('Camera init error:', err)
      setCameraError(err?.message || 'Could not access camera. Check permissions or use HTTPS.')
      isInitRef.current = false
    }
  }, [])

  const stopScanner = useCallback(() => {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        const state = scanner.getState()
        if (state === 2 || state === 3) {
          scanner.stop().catch(() => {})
        }
      } catch {}
      try {
        scanner.clear()
      } catch {}
      scannerRef.current = null
      isInitRef.current = false
    }
  }, [])

  useEffect(() => {
    if (scanState === 'scanning') {
      const timer = setTimeout(() => startScanner(), 300)

      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    }
  }, [scanState, startScanner, stopScanner])

  useEffect(() => {
    return () => {
      stopScanner()
      try {
        const el = document.getElementById(QR_READER_ID)
        const video = el?.querySelector('video')
        if (video?.srcObject) {
          const tracks = (video.srcObject as MediaStream).getTracks()
          tracks.forEach(t => t.stop())
          video.srcObject = null
        }
      } catch {}
    }
  }, [stopScanner])

  const searchResults = searchResponse?.data ?? []

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleScanNext = () => {
    setScanResult(null)
    setScanError('')
    setCameraError('')
    stopScanner()
    setScanState('scanning')
  }

  const handleViewPass = () => {
    if (scanResult) router.push(`/vms/passes/${scanResult.pass_id}`)
  }

  const handleManualPassClick = (passId: string) => {
    router.push(`/vms/passes/${passId}`)
  }

  const handleSwitchToManual = () => {
    stopScanner()
    setSearchQuery('')
    setScanState('manual_search')
  }

  const handleBackToScanner = () => {
    setScanResult(null)
    setScanError('')
    setCameraError('')
    stopScanner()
    setScanState('scanning')
  }

  // ── Info cell helper ────────────────────────────────────────────────────────

  const InfoCell = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box>
      <Typography
        variant='caption'
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: theme.palette.customColors.neutralSecondary,
          mb: '3px',
          display: 'block',
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )

  // ── Scanner card ─────────────────────────────────────────────────────────────

  const renderScanner = () => (
    <Card sx={{ borderRadius: '10px', overflow: 'hidden' }}>
      {/* Card header */}
      <Box
        sx={{
          px: 5,
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: theme.palette.customColors.OutlineVariant,
        }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          Scan QR Code
        </Typography>
        <Button
          variant='text'
          size='small'
          onClick={handleSwitchToManual}
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.dark,
            textTransform: 'none',
          }}
        >
          Manual Search
        </Button>
      </Box>

      {/* Card body */}
      <Box sx={{ p: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {/* QR reader styles */}
          <style>{`
            @keyframes scanLine {
              0%, 100% { top: 0; }
              50% { top: calc(100% - 2px); }
            }
            #${QR_READER_ID} { border: none !important; }
            #${QR_READER_ID} video { object-fit: cover !important; border-radius: 0 !important; }
            #${QR_READER_ID} img { display: none !important; }
            #${QR_READER_ID}__scan_region { min-height: 0 !important; }
            #${QR_READER_ID}__scan_region > br { display: none !important; }
            #${QR_READER_ID}__dashboard { display: none !important; }
            #${QR_READER_ID}__header_message { display: none !important; }
          `}</style>

          <Box
            sx={{
              position: 'relative',
              width: '280px',
              height: '280px',
              bgcolor: '#111',
              border: '2px solid',
              borderColor: theme.palette.primary.main,
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Box id={QR_READER_ID} sx={{ width: '100%', height: '100%' }} />

            {/* Scan line */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                bgcolor: theme.palette.primary.main,
                boxShadow: `0 0 8px ${theme.palette.primary.main}, 0 0 16px ${theme.palette.primary.main}30`,
                animation: 'scanLine 2s ease-in-out infinite',
                zIndex: 10,
              }}
            />

            {/* Corner brackets */}
            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(corner => {
              const isTop = corner.includes('top')
              const isLeft = corner.includes('left')

              return (
                <Box
                  key={corner}
                  sx={{
                    position: 'absolute',
                    [isTop ? 'top' : 'bottom']: 8,
                    [isLeft ? 'left' : 'right']: 8,
                    width: 20,
                    height: 20,
                    zIndex: 20,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      [isTop ? 'top' : 'bottom']: 0,
                      [isLeft ? 'left' : 'right']: 0,
                      width: '20px',
                      height: '3px',
                      bgcolor: theme.palette.primary.main,
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      [isTop ? 'top' : 'bottom']: 0,
                      [isLeft ? 'left' : 'right']: 0,
                      width: '3px',
                      height: '20px',
                      bgcolor: theme.palette.primary.main,
                    },
                  }}
                />
              )
            })}
          </Box>

          {/* Hint / error text */}
          {cameraError ? (
            <Box sx={{ textAlign: 'center', maxWidth: '280px' }}>
              <Icon icon='mdi:camera-off' fontSize={20} />
              <Typography variant='caption' sx={{ mt: 1, display: 'block', color: theme.palette.error.main }}>
                {cameraError}
              </Typography>
            </Box>
          ) : (
            <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, textAlign: 'center' }}>
              Point camera at visitor&apos;s QR code
            </Typography>
          )}
        </Box>

        {/* Site selector */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mt: 4,
            pt: 4,
            borderTop: '1px solid',
            borderColor: theme.palette.customColors.OutlineVariant,
          }}
        >
          <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Scanning at:
          </Typography>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
            >
              {sites.map((site: any) => (
                <MenuItem key={site.value} value={site.value}>
                  {site.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Card>
  )

  // ── Result card ──────────────────────────────────────────────────────────────

  const renderResult = () => {
    if (!scanResult) return null

    const shortPassId =
      scanResult.pass_id.length > 12
        ? `${scanResult.pass_id.slice(0, 8)}…${scanResult.pass_id.slice(-4)}`
        : scanResult.pass_id

    return (
      <>
        {/* Divider */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            my: 5,
            '&::before': { content: '""', flex: 1, height: '1px', bgcolor: theme.palette.customColors.OutlineVariant },
            '&::after': { content: '""', flex: 1, height: '1px', bgcolor: theme.palette.customColors.OutlineVariant },
          }}
        >
          <Typography
            variant='caption'
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: theme.palette.customColors.neutralSecondary,
              whiteSpace: 'nowrap',
            }}
          >
            Scan Result
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: theme.palette.customColors.Surface,
            borderRadius: '10px',
            overflow: 'hidden',
            borderLeft: '4px solid',
            borderColor: theme.palette.primary.main,
            mb: 3,
          }}
        >
          <Box sx={{ p: 4 }}>
            {/* Scan type label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Icon icon='mdi:login' fontSize={18} />
              <Typography
                variant='caption'
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: theme.palette.primary.dark,
                }}
              >
                Entry Scan
              </Typography>
            </Box>

            {/* Visitor name + meta */}
            <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, mb: 0.5 }}>
              {scanResult.visitor_name}
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary, mb: 3 }}>
              {scanResult.department} · {scanResult.visitor_contact}
            </Typography>

            {/* Divider */}
            <Box sx={{ height: '1px', bgcolor: theme.palette.customColors.OutlineVariant, mb: 3 }} />

            {/* Info grid row 1 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <InfoCell label='Status'>
                <StatusChip status={scanResult.status} />
              </InfoCell>
              {scanResult.time_in && (
                <InfoCell label='Time In'>
                  <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
                    {scanResult.time_in}
                  </Typography>
                </InfoCell>
              )}
            </Box>

            {/* Info grid row 2 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <InfoCell label='Valid'>
                <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
                  {scanResult.start_date} – {scanResult.end_date}
                </Typography>
              </InfoCell>
              <InfoCell label='Pass ID'>
                <Typography
                  variant='caption'
                  sx={{
                    color: theme.palette.customColors.neutralSecondary,
                    fontWeight: 500,
                    fontFamily: '"Roboto Mono", "Courier New", monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {shortPassId}
                </Typography>
              </InfoCell>
            </Box>

            {/* Button row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
              <Button
                variant='contained'
                size='small'
                startIcon={<Icon icon='mdi:qrcode-scan' fontSize={16} />}
                onClick={handleScanNext}
                sx={{ textTransform: 'none' }}
              >
                Scan Next
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<Icon icon='mdi:open-in-new' fontSize={16} />}
                onClick={handleViewPass}
                sx={{ textTransform: 'none' }}
              >
                View Pass
              </Button>
            </Box>
          </Box>
        </Box>
      </>
    )
  }

  // ── Error card ───────────────────────────────────────────────────────────────

  const renderError = () => (
    <>
      {/* Divider */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          my: 5,
          '&::before': { content: '""', flex: 1, height: '1px', bgcolor: theme.palette.customColors.OutlineVariant },
          '&::after': { content: '""', flex: 1, height: '1px', bgcolor: theme.palette.customColors.OutlineVariant },
        }}
      >
        <Typography
          variant='caption'
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: theme.palette.customColors.neutralSecondary,
            whiteSpace: 'nowrap',
          }}
        >
          Scan Result
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: theme.palette.customColors.BgTeritary,
          borderRadius: '10px',
          overflow: 'hidden',
          borderLeft: '4px solid',
          borderColor: theme.palette.customColors.Tertiary,
          mb: 3,
        }}
      >
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Icon icon='mdi:alert-circle-outline' fontSize={18} />
            <Typography
              variant='caption'
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: theme.palette.customColors.Tertiary,
              }}
            >
              Scan Failed
            </Typography>
          </Box>

          <Typography variant='body1' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, mb: 1 }}>
            {scanError}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
            <Button
              variant='contained'
              size='small'
              startIcon={<Icon icon='mdi:qrcode-scan' fontSize={16} />}
              onClick={handleScanNext}
              sx={{ textTransform: 'none' }}
            >
              Scan Next
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  )

  // ── Manual search card ───────────────────────────────────────────────────────

  const renderManualSearch = () => (
    <Card sx={{ borderRadius: '10px', overflow: 'hidden' }}>
      {/* Card header */}
      <Box
        sx={{
          px: 5,
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: theme.palette.customColors.OutlineVariant,
        }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          Manual Search
        </Typography>
        <Button
          variant='text'
          size='small'
          startIcon={<Icon icon='mdi:arrow-left' fontSize={16} />}
          onClick={handleBackToScanner}
          sx={{
            fontWeight: 500,
            color: theme.palette.primary.dark,
            textTransform: 'none',
          }}
        >
          Back to Scanner
        </Button>
      </Box>

      {/* Card body */}
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TextField
          fullWidth
          size='small'
          placeholder='Search by name, department, or pass ID…'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='mdi:magnify' fontSize={18} color={theme.palette.customColors.neutralSecondary} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => setSearchQuery('')}>
                  <Icon icon='mdi:close' fontSize={16} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Results */}
        {searchResults.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              color: theme.palette.customColors.neutralSecondary,
            }}
          >
            <Icon icon='mdi:magnify-close' fontSize={40} />
            <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
              No passes match your search.
            </Typography>
          </Box>
        ) : (
          <Box>
            {searchResults.map((pass: any, idx: number) => (
              <Box
                key={pass.pass_id}
                onClick={() => handleManualPassClick(pass.pass_id)}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: theme.palette.customColors.OutlineVariant,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  bgcolor: 'background.paper',
                  mb: idx < searchResults.length - 1 ? 2 : 0,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: theme.palette.customColors.Surface,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 3,
                  }}
                >
                  {/* Left: avatar + info */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        bgcolor: theme.palette.customColors.Surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: theme.palette.primary.dark,
                      }}
                    >
                      <Icon icon='mdi:account' fontSize={20} />
                    </Box>
                    <Box>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, mb: 0.5 }}>
                        {pass.visitor_name}
                      </Typography>
                      <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary, display: 'block' }}>
                        {pass.department}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: theme.palette.customColors.neutralSecondary }}>
                        <Icon icon='mdi:calendar-range' fontSize={13} />
                        <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                          {pass.start_date} → {pass.end_date}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Right: status + chevron */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <StatusChip status={pass.status} />
                    <Box sx={{ color: theme.palette.customColors.neutralSecondary }}>
                      <Icon icon='mdi:chevron-right' fontSize={18} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  )

  // ── Root ─────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: '520px', mx: 'auto', width: '100%', py: 6, px: 5 }}>
      {scanState === 'manual_search' ? (
        renderManualSearch()
      ) : (
        <>
          {renderScanner()}
          {scanState === 'result' && renderResult()}
          {scanState === 'error' && renderError()}
        </>
      )}
    </Box>
  )
}

export default QrScanner
