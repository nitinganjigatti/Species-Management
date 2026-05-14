import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import TableContainer from '@mui/material/TableContainer'
import { Avatar } from '@mui/material'
import Icon from 'src/@core/components/icon'
import type { DashboardLabRequestsProps } from 'src/types/dashboard/components'

const rowColors = ['#FA6140', '#E4B819']

const DashboardLabRequests: React.FC<DashboardLabRequestsProps> = ({ labRequests }) => {
  const { t } = useTranslation()

  return (
    <CardContent sx={{ pt: theme => `${theme.spacing(2.5)} !important` }}>
      <Box sx={{ mb: 5.75, display: 'flex', alignItems: 'center' }}>
        <Avatar variant='rounded' sx={{ mr: 4, width: 50, height: 50, bgcolor: '#00AFD633' }}>
          <Avatar variant='square' src='/dashboard/export_notes1.svg' sx={{ p: 0.5 }} />
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'start' }}>
          <Typography sx={{ color: '#44544A', fontSize: '24px', fontWeight: 600 }}>
            {labRequests.total_requests}
          </Typography>
          <Typography variant='caption' sx={{ color: '#44544A', fontSize: '14px', fontWeight: 400 }}>
            {t('dashboard.total_requests')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '16px', color: '#44544A' }}>
          {t('dashboard.completed')} - {labRequests.completed_request}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#37BD69' }}>
          {labRequests.completed_requests_percentage}%
        </Typography>
      </Box>

      <LinearProgress value={labRequests.completed_requests_percentage} sx={{ mb: 4 }} variant='determinate' />

      <TableContainer>
        <Table>
          <TableBody>
            {labRequests?.lab_stats?.map((row, index) => (
              <TableRow
                key={row.title}
                sx={{
                  '&:last-of-type td': { border: 0 },
                  '& .MuiTableCell-root': {
                    '&:last-of-type': { pr: 0 },
                    '&:first-of-type': { pl: '0 !important' },
                    py: theme => `${theme.spacing(2.75)} !important`
                  }
                }}
              >
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      '& svg': { mr: 1.8, color: rowColors[index] }
                    }}
                  >
                    <Icon icon='mdi:circle' fontSize='1rem' />
                    <Typography variant='body2' sx={{ color: '#44544A', fontWeight: 400, fontSize: '16px' }}>
                      {row.title}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' sx={{ fontWeight: 600, fontSize: '16px', color: '#44544A' }}>
                    {row.value}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Typography variant='body2' sx={{ mr: 1.5, fontWeight: 500, fontSize: '16px', color: '#FA6140' }}>
                      {row.percentage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  )
}

export default DashboardLabRequests
