import { Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { format } from 'date-fns'
import Utility from 'src/utility'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import type { MedicalRecordNotesProps } from 'src/types/lab'

const MedicalRecordNotes = ({ notes }: MedicalRecordNotesProps) => {
  const theme = useTheme()

  if (!notes?.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: theme.palette.customColors.antzNeturalBg }}>Empty Notes</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      {notes?.map(note => (
        <Box
          key={note.id}
          sx={{
            mb: 4,
            display: 'flex',
            gap: 2
          }}
        >
          <FallbackAvatar
            src={note.user_profile?.user_profile_pic}
            alt={note.user_profile?.name}
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 500, color: theme.palette.primary.light }}>
                {`${note.user_profile?.first_name} ${note.user_profile?.last_name}`}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: theme.palette.customColors.antzNeturalBg }}>
                {format(
                  new Date(Utility.convertUTCToLocal(note.modified_at ? note.modified_at : note.created_at)),
                  'MMM dd, yyyy hh:mm a'
                )}{' '}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.customColors.OnSurfaceVariant,
                backgroundColor: 'rgba(68, 84, 74, 0.05)',
                p: 2,
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {note.note}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default MedicalRecordNotes
