'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
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

// Sites loaded from API in component

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusChip = ({ status }: { status: string }) => {
  const config = VMS_STATUS_CONFIG[status] ?? { label: status, color: '#616161', bgColor: '#F0F0F0' }

  return (
    <Chip
      size='small'
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Box
            component='span'
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: config.color,
            }}
          />
          {config.label}
        </Box>
      }
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 500,
        fontSize: '12px',
        height: 'auto',
        py: '3px',
        px: '4px',
        borderRadius: '100px',
        '& .MuiChip-label': { px: 0 },
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

  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedSite, setSelectedSite] = useState<string>(defaultSite)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
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
        (decodedText) => {
          // QR decoded — pause scanner, process result
          scanner.pause(true)

          scanMutation.mutate(
            { qr_data: decodedText, site_id: selectedSite ? Number(selectedSite) : null },
            {
              onSuccess: (response) => {
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
        () => {
          // QR scan error (not found in frame) — ignore, scanner keeps trying
        }
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
        if (state === 2 || state === 3) { // SCANNING or PAUSED
          scanner.stop().catch(() => {})
        }
      } catch {
        // ignore
      }
      try {
        scanner.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
      isInitRef.current = false
    }
  }, [])

  // ── Init scanner when in scanning state ────────────────────────────────────

  useEffect(() => {
    if (scanState === 'scanning') {
      const timer = setTimeout(() => startScanner(), 300)

      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    }
  }, [scanState, startScanner, stopScanner])

  // ── Cleanup on unmount — belt and suspenders ───────────────────────────────

  useEffect(() => {
    return () => {
      stopScanner()

      // Force-kill any remaining video tracks as a fallback
      try {
        const el = document.getElementById(QR_READER_ID)
        const video = el?.querySelector('video')
        if (video?.srcObject) {
          const tracks = (video.srcObject as MediaStream).getTracks()
          tracks.forEach(t => t.stop())
          video.srcObject = null
        }
      } catch {
        // ignore
      }
    }
  }, [stopScanner])

  // ── Search filtering ───────────────────────────────────────────────────────

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
        sx={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'text.secondary',
          mb: '3px',
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )

  // ── Scanner card ─────────────────────────────────────────────────────────────

  const renderScanner = () => (
    <Card
      sx={{
        borderRadius: '10px',
        boxShadow: theme => theme.shadows[1],
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          px: '20px',
          py: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: 'text.primary' }}>
          Scan QR Code
        </Typography>
        <Button
          variant='text'
          size='small'
          onClick={handleSwitchToManual}
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            color: 'success.dark',
            textTransform: 'none',
            px: 1,
            py: '6px',
            borderRadius: '8px',
            '&:hover': { bgcolor: 'success.light' },
          }}
        >
          Manual Search
        </Button>
      </Box>

      {/* Card body */}
      <Box sx={{ padding: '24px 20px' }}>
        {/* Camera frame wrap */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {/* Camera frame — html5-qrcode renders inside #vms-qr-reader */}
          {/* Keyframes injected once, only for animation definition */}
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
            sx={theme => ({
              position: 'relative',
              width: '280px',
              height: '280px',
              bgcolor: '#111',
              border: '2px solid',
              borderColor: 'success.main',
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
            })}
          >
            {/* QR reader element — html5-qrcode injects camera here */}
            <Box
              id={QR_READER_ID}
              sx={{ width: '100%', height: '100%' }}
            />

            {/* Scan line */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                bgcolor: 'success.main',
                boxShadow: theme => `0 0 8px ${theme.palette.success.main}, 0 0 16px ${theme.palette.success.main}30`,
                animation: 'scanLine 2s ease-in-out infinite',
                zIndex: 10,
              }}
            />

            {/* Corner brackets — top-left */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                width: 20,
                height: 20,
                zIndex: 20,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '20px',
                  height: '3px',
                  bgcolor: 'success.main',
                  borderRadius: '2px 0 0 0',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '20px',
                  bgcolor: 'success.main',
                  borderRadius: '2px 0 0 0',
                },
              }}
            />

            {/* Corner brackets — top-right */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 20,
                height: 20,
                zIndex: 20,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '20px',
                  height: '3px',
                  bgcolor: 'success.main',
                  borderRadius: '0 2px 0 0',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '3px',
                  height: '20px',
                  bgcolor: 'success.main',
                  borderRadius: '0 2px 0 0',
                },
              }}
            />

            {/* Corner brackets — bottom-left */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                width: 20,
                height: 20,
                zIndex: 20,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '20px',
                  height: '3px',
                  bgcolor: 'success.main',
                  borderRadius: '0 0 0 2px',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '3px',
                  height: '20px',
                  bgcolor: 'success.main',
                  borderRadius: '0 0 0 2px',
                },
              }}
            />

            {/* Corner brackets — bottom-right */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 20,
                height: 20,
                zIndex: 20,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '20px',
                  height: '3px',
                  bgcolor: 'success.main',
                  borderRadius: '0 0 2px 0',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '3px',
                  height: '20px',
                  bgcolor: 'success.main',
                  borderRadius: '0 0 2px 0',
                },
              }}
            />
          </Box>

          {/* Hint / error text */}
          {cameraError ? (
            <Box sx={{ textAlign: 'center', maxWidth: '280px' }}>
              <Icon icon='mdi:camera-off' fontSize={20} />
              <Typography sx={{ mt: '4px', fontSize: '13px', color: 'error.main' }}>
                {cameraError}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '13px', color: 'text.secondary', textAlign: 'center' }}>
              Point camera at visitor&apos;s QR code
            </Typography>
          )}
        </Box>

        {/* Site selector row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            mt: '18px',
            pt: '18px',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Scanning at:
          </Typography>
          <FormControl size='small' sx={{ flex: 1 }}>
            <Select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              sx={{
                fontSize: '14px',
                color: 'text.primary',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'success.main' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'success.main' },
              }}
            >
              {sites.map(site => (
                <MenuItem key={site.value} value={site.value} sx={{ fontSize: '14px' }}>
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

    const shortPassId = scanResult.pass_id.length > 12
      ? `${scanResult.pass_id.slice(0, 8)}…${scanResult.pass_id.slice(-4)}`
      : scanResult.pass_id

    return (
      <>
        {/* Divider */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            my: '28px',
            '&::before': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' },
            '&::after': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' },
          }}
        >
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
            }}
          >
            Scan Result
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: 'success.light',
            borderRadius: '10px',
            boxShadow: theme => theme.shadows[1],
            overflow: 'hidden',
            borderLeft: '4px solid',
            borderColor: 'success.main',
            mb: '16px',
          }}
        >
          <Box sx={{ p: '18px 18px 18px 22px' }}>
            {/* Scan type label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '10px' }}>
              <Icon icon='mdi:login' fontSize={18} color='success.dark' />
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'success.dark',
                }}
              >
                Entry Scan
              </Typography>
            </Box>

            {/* Visitor name + meta */}
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: 'text.primary', mb: '3px' }}>
              {scanResult.visitor_name}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: '14px' }}>
              {scanResult.department} · {scanResult.visitor_contact}
            </Typography>

            {/* Thin divider */}
            <Box sx={{ height: '1px', bgcolor: 'action.disabled', mb: '14px', opacity: 0.3 }} />

            {/* Info grid row 1 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', mb: '10px' }}>
              <InfoCell label='Status'>
                <StatusChip status={scanResult.status} />
              </InfoCell>
              {scanResult.time_in && (
                <InfoCell label='Time In'>
                  <Typography sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 500 }}>
                    {scanResult.time_in}
                  </Typography>
                </InfoCell>
              )}
            </Box>

            {/* Info grid row 2 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <InfoCell label='Valid'>
                <Typography sx={{ fontSize: '13px', color: 'text.primary', fontWeight: 500 }}>
                  {scanResult.start_date} – {scanResult.end_date}
                </Typography>
              </InfoCell>
              <InfoCell label='Pass ID'>
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: 'text.secondary',
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mt: '16px' }}>
              <Button
                variant='contained'
                size='small'
                startIcon={<Icon icon='mdi:qrcode-scan' fontSize={16} />}
                onClick={handleScanNext}
                sx={{
                  bgcolor: 'success.main',
                  color: 'common.white',
                  fontWeight: 500,
                  fontSize: '13px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: '12px',
                  py: '6px',
                  '&:hover': {
                    bgcolor: 'success.dark',
                    boxShadow: theme => `0 2px 8px ${theme.palette.success.main}4D`,
                  },
                }}
              >
                Scan Next
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<Icon icon='mdi:open-in-new' fontSize={16} />}
                onClick={handleViewPass}
                sx={{
                  borderColor: 'success.main',
                  color: 'success.dark',
                  fontWeight: 500,
                  fontSize: '13px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: '12px',
                  py: '6px',
                  bgcolor: 'common.white',
                  '&:hover': { bgcolor: 'success.light' },
                }}
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
          gap: '12px',
          my: '28px',
          '&::before': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' },
          '&::after': { content: '""', flex: 1, height: '1px', bgcolor: 'divider' },
        }}
      >
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          Scan Result
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: 'error.light',
          borderRadius: '10px',
          boxShadow: theme => theme.shadows[1],
          overflow: 'hidden',
          borderLeft: '4px solid',
          borderColor: 'error.main',
          mb: '16px',
        }}
      >
        <Box sx={{ p: '18px 18px 18px 22px' }}>
          {/* Scan failed label */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '10px' }}>
            <Icon icon='mdi:alert-circle-outline' fontSize={18} color='error.main' />
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'error.main',
              }}
            >
              Scan Failed
            </Typography>
          </Box>

          {/* Error message */}
          <Typography sx={{ fontSize: '14px', color: 'text.primary', fontWeight: 500, mb: '6px' }}>
            {scanError}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
            Visitor: Suresh Nair · HR
          </Typography>

          {/* Button row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mt: '16px' }}>
            <Button
              variant='contained'
              size='small'
              startIcon={<Icon icon='mdi:qrcode-scan' fontSize={16} />}
              onClick={handleScanNext}
              sx={{
                bgcolor: 'success.main',
                color: 'common.white',
                fontWeight: 500,
                fontSize: '13px',
                textTransform: 'none',
                borderRadius: '8px',
                px: '12px',
                py: '6px',
                '&:hover': {
                  bgcolor: 'success.dark',
                  boxShadow: theme => `0 2px 8px ${theme.palette.success.main}4D`,
                },
              }}
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
    <Card
      sx={{
        borderRadius: '10px',
        boxShadow: theme => theme.shadows[1],
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          px: '20px',
          py: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: 'text.primary' }}>
          Manual Search
        </Typography>
        <Button
          variant='text'
          size='small'
          startIcon={<Icon icon='mdi:arrow-left' fontSize={16} />}
          onClick={handleBackToScanner}
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            color: 'success.dark',
            textTransform: 'none',
            px: 1,
            py: '6px',
            borderRadius: '8px',
            '&:hover': { bgcolor: 'success.light' },
          }}
        >
          Back to Scanner
        </Button>
      </Box>

      {/* Card body */}
      <Box sx={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Search input */}
        <TextField
          fullWidth
          size='small'
          placeholder='Search by name, department, or pass ID…'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Icon icon='mdi:magnify' fontSize={18} />
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
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '14px',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'success.main' },
              '&.Mui-focused fieldset': { borderColor: 'success.main', boxShadow: theme => `0 0 0 3px ${theme.palette.success.main}1A` },
            },
          }}
        />

        {/* Results */}
        {searchResults.length === 0 ? (
          <Box
            sx={{
              py: '48px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: 'text.secondary',
            }}
          >
            <Icon icon='mdi:magnify-close' fontSize={40} />
            <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
              No passes match your search.
            </Typography>
          </Box>
        ) : (
          <Box>
            {searchResults.map((pass, idx) => (
              <Box
                key={pass.pass_id}
                onClick={() => handleManualPassClick(pass.pass_id)}
                sx={{
                  p: '14px 16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  bgcolor: 'background.paper',
                  mb: idx < searchResults.length - 1 ? '12px' : 0,
                  '&:hover': {
                    boxShadow: theme => `0 4px 12px ${theme.palette.action.hover}`,
                    borderColor: 'success.main',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  {/* Left: avatar + info */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    <Box
                      sx={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: 'success.dark',
                      }}
                    >
                      <Icon icon='mdi:account' fontSize={20} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mb: '2px' }}>
                        {pass.visitor_name}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        {pass.department}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mt: '4px', color: 'text.secondary' }}>
                        <Icon icon='mdi:calendar-range' fontSize={13} />
                        <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                          {pass.start_date} → {pass.end_date}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Right: status + chevron */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <StatusChip status={pass.status} />
                    <Box sx={{ color: 'text.secondary' }}>
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
    <Box sx={{ maxWidth: '520px', mx: 'auto', width: '100%', py: '32px', px: '24px' }}>
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
