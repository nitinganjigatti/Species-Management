// ** MUI Import
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Demo Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal'

const TotalListCard = ({ data, modifiedProperties }) => {
  if (data?.length > 0) {
    return (
      <Grid container spacing={2}>
        {data?.map((item, index) => {
          return (
            <Grid item xs={6} sm={4} lg={12 / 5} key={index}>
              <CardStatisticsHorizontal
                title={modifiedProperties(item.name).name}
                stats={item.value}
                icon={<Icon icon={modifiedProperties(item.name).icon} color={modifiedProperties(item.name).color} />}
                color={modifiedProperties(item.name).color}
                bg={modifiedProperties(item.name).bgColor}
              />
            </Grid>
          )
        })}
      </Grid>
    )
  } else {
    return null
  }
}

export default TotalListCard
