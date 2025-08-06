import { TimelineConnector, TimelineContent, TimelineItem, TimelineSeparator } from "@mui/lab"
import { Box } from "@mui/system"
import FallbackAvatar from "src/views/utility/FallbackAvatar"
import { useTheme } from '@mui/material/styles'
import moment from "moment"
import Utility from "src/utility"
import { Typography } from "@mui/material"

const IncidentDetailsCard = ({ item, index, data }) => {
    const theme = useTheme()

    const cardData = {
        ...(item?.incident_type === 'missing'
            ? {
                'Missing Since': `${moment(Utility.convertUTCToLocalDate(item.incident_date)).format('DD MMM YYYY')} • ${Utility.convertUTCToLocaltime(item.incident_date)}`,
                'Last seen or escaped from': item?.additional_info?.last_seen,
                'Animal behaviour before incident': item?.additional_info?.animal_behaviour_before_incident,
                'Actions taken': item?.additional_info?.action_taken,
                'Steps to prevent future incidents': item?.additional_info?.steps_to_prevent
            }
            : {
                'Found On': `${moment(Utility.convertUTCToLocalDate(item.incident_date)).format('DD MMM YYYY')} • 
                ${Utility.convertUTCToLocaltime(item.incident_date)}`,
                'Behaviour observation': '',
                'Physical condition': '',
                'Health assessment': '',
                'Injury details': '',
                'Immediate action taken': '',
            }),
        // 'Immediate action taken': item?.additional_info?.action_taken
    }

    return (
        <TimelineItem key={index}>
            <TimelineSeparator
                sx={{
                    '& span': {
                        ml: '1px',
                        background: 'transparent',
                        width: '1px',
                        height: '100%',
                        backgroundImage: `repeating-linear-gradient(
                            to bottom,
                            ${theme.palette.customColors.OutlineVariant},
                            ${theme.palette.customColors.OutlineVariant} 5px,
                            transparent 8px,
                            transparent 13px
                            )`,
                        opacity: 1
                    }
                }}
            >
                <Box
                    sx={{
                        // border: '2px solid ',
                        backgroundColor:
                            item.incident_type === 'missing' || item.status === 'Discard' || item.status === 'Rotten'
                                ? theme.palette.formContent.tertiary
                                : theme.palette.primary.dark,
                        boxSizing: 'border-box',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                ></Box>
                {data.length === index + 1 ? null : <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent
                sx={{
                    ml: 4,
                    borderRadius: '8px',
                    position: 'relative',
                    top: -5,
                    p: 0
                }}
            >
                <Typography
                    sx={{
                        color: item.incident_type === 'missing' ? '#FA6140' : '#006D35',
                        fontWeight: 600,
                        fontSize: 14,
                        mb: '16px'
                    }}
                >
                    {item.incident_label}
                </Typography>
                <Box
                    sx={{
                        flexGrow: 1,
                        backgroundColor: item.incident_type === 'found' ? '#E1F9ED' : '#FFBDA833',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        p: '16px'
                    }}
                >
                    {Object.entries(cardData).map(([key, value]) => (
                        <Box key={key}>
                            <Typography
                                sx={{
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.OnSurfaceVariant
                                }}
                            >
                                {key}
                            </Typography>
                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    fontSize: '16px',
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.neutralPrimary
                                }}
                            >
                                {value}
                            </Typography>
                        </Box>
                    ))}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FallbackAvatar src={item?.reported_by_profile_pic} sx={{ borderRadius: '50%', width: 34, height: 34 }} />
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.OnSurfaceVariant
                                }}
                            >
                                {item.reported_by_name}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 400,
                                    letterSpacing: 0,
                                    color: theme.palette.customColors.OnSurfaceVariant
                                }}
                            >
                                {`${moment(Utility.convertUTCToLocalDate(item.incident_date)).format('DD MMM YYYY')} | ${Utility.convertUTCToLocaltime(item.incident_date)}`}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </TimelineContent>
        </TimelineItem>
    )
}

export default IncidentDetailsCard