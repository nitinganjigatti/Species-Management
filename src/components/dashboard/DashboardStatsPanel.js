import React from 'react'
import { Box, Card, Typography, Grid, Avatar } from '@mui/material'
import Utility from 'src/utility'

const iconMap = {
  pets: '/dashboard/all_animal.svg',

  // eggs: '/dashboard/Egg.svg',
  enclosures: ' /dashboard/insights/Enclosure.svg',
  medicalRecords: '/dashboard/medical_record.svg',
  labRequests: '/dashboard/lab_req.svg',
  activeUsers: '/dashboard/user.svg',
  lowStockMedicines: '/dashboard/medicines.svg'
}

const bgColors = {
  pets: '#E1F9ED',
  enclosures: '#FCF4AE99',
  medicalRecords: '#FFBDA84D',
  labRequests: '#AFEFEB66',
  activeUsers: '#E8F4F2',
  lowStockMedicines: '#FFD3D366'
}

const StatCard = ({ icon, value, label, bgColor }) => {
  return (
    <Card
      sx={{
        p: 4,
        height: '100%',

        //  width: 272,
        borderRadius: '10px',
        boxShadow: '0px 2px 10px 0px #4C4E6438'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Avatar
          variant='square'
          sx={{
            bgcolor: bgColor,
            width: 48,
            height: 48,
            borderRadius: '8px',
            p: 2.5
          }}
          src={icon}
        />
        <Box
          sx={{
            textAlign: 'start'
          }}
        >
          <Typography sx={{ fontSize: '34px', fontWeight: 600, color: '#44544A' }}>
            {Utility.formatAmountCompactDisplay(value)}
          </Typography>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#44544A' }}>{label}</Typography>
        </Box>
      </Box>
    </Card>
  )
}

const DashboardStatsPanel = ({ stats }) => {
  return (
    <>
      <Grid container spacing={3}>
        {stats.map(({ key, value, label, bgColor, icon }) => (
          <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={key}>
            <StatCard icon={icon || iconMap[key]} value={value} label={label} bgColor={bgColor || bgColors[key]} />
          </Grid>
        ))}
      </Grid>
    </>
  )
}

export default DashboardStatsPanel

// import React from 'react'
// import { Box, Card, Typography, Grid, Avatar } from '@mui/material'
// import PetsIcon from '@mui/icons-material/Pets'
// import EggIcon from '@mui/icons-material/Egg'
// import DescriptionIcon from '@mui/icons-material/Description'
// import ScienceIcon from '@mui/icons-material/Science'
// import PeopleIcon from '@mui/icons-material/People'
// import MedicalServicesIcon from '@mui/icons-material/MedicalServices'

// const StatCard = ({ icon, value, label, bgColor }) => {
//   return (
//     <Card sx={{ p: 3, height: '100%', borderRadius: '10px', boxShadow: '0px 2px 10px 0px #4C4E6438' }}>
//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//         <Avatar
//           variant='square'
//           sx={{
//             bgcolor: bgColor,
//             width: 48,
//             height: 48,
//             borderRadius: '8px'
//           }}
//         >
//           {icon}
//         </Avatar>
//         <Box textAlign={'start'}>
//           <Typography variant='h4' fontWeight='bold' sx={{ mb: 0.5 }}>
//             {value}
//           </Typography>
//           <Typography variant='body2' color='text.secondary'>
//             {label}
//           </Typography>
//         </Box>
//       </Box>
//     </Card>
//   )
// }

// const DashboardStatsPanel = ({ stats }) => {
//   // Default values if no stats are provided
//   const defaultStats = {
//     animals: 107400,
//     eggs: 245,
//     medicalRecords: 512,
//     labRequests: 345,
//     activeUsers: 192,
//     lowStockMedicines: 54
//   }

//   const data = stats || defaultStats

//   return (
//     <Box sx={{ p: 2 }}>
//       <Grid container spacing={2}>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard icon={<PetsIcon />} value={data.animals.toLocaleString()} label='All animals' bgColor='#E1F9ED' />
//         </Grid>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard icon={<EggIcon />} value={data.eggs} label='Eggs collected' bgColor='rgba(255, 235, 128, 0.2)' />
//         </Grid>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard
//             icon={<DescriptionIcon />}
//             value={data.medicalRecords}
//             label='Medical records'
//             bgColor='rgba(255, 192, 173, 0.2)'
//           />
//         </Grid>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard
//             icon={<ScienceIcon />}
//             value={data.labRequests}
//             label='Lab requests'
//             bgColor='rgba(173, 216, 230, 0.2)'
//           />
//         </Grid>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard
//             icon={<PeopleIcon />}
//             value={data.activeUsers}
//             label='Active users'
//             bgColor='rgba(176, 196, 222, 0.2)'
//           />
//         </Grid>
//         <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
//           <StatCard
//             icon={<MedicalServicesIcon />}
//             value={data.lowStockMedicines}
//             label='Low stock medicines'
//             bgColor='rgba(255, 182, 193, 0.2)'
//           />
//         </Grid>
//       </Grid>
//     </Box>
//   )
// }

// export default DashboardStatsPanel

{
  /* <DashboardStatsPanel
        stats={{
          animals: 107400,
          eggs: 245,
          medicalRecords: 512,
          labRequests: 345,
          activeUsers: 192,
          lowStockMedicines: 54
        }}
      /> */
}
