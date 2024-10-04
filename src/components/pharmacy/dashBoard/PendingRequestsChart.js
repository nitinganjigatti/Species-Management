// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { PolarArea } from 'react-chartjs-2'
import { useEffect, useState } from 'react'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import { Chart } from 'chart.js/auto'
import { Bar } from 'react-chartjs-2'
import { getPendingList } from 'src/lib/api/pharmacy/dashboard'

const PendingRequestsChart = props => {
  // ** Props
  const { info, grey, green, yellow, primary, warning, legendColor } = props
  const [pendingList, setPendingList] = useState([])

  const getAllPendingRequestList = async () => {
    try {
      const result = await getPendingList()

      if (result?.success === true && result?.data) {
        setPendingList(result?.data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getAllPendingRequestList()
  }, [])

  // const options = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   animation: { duration: 500 },
  //   layout: {
  //     padding: {
  //       top: -5,
  //       bottom: -45
  //     }
  //   },
  //   scales: {
  //     r: {
  //       grid: { display: false },
  //       ticks: { display: false }
  //     }
  //   },
  //   plugins: {
  //     legend: {
  //       position: 'right',
  //       labels: {
  //         padding: 25,
  //         boxWidth: 9,
  //         color: legendColor,
  //         usePointStyle: true
  //       }
  //     }
  //   }
  // }

  // const data = {
  //   labels: ['Africa', 'Asia', 'Europe', 'America', 'Antarctica', 'Australia'],
  //   datasets: [
  //     {
  //       borderWidth: 0,
  //       label: 'Population (millions)',
  //       data: [19, 17.5, 15, 13.5, 11, 9],
  //       backgroundColor: [primary, yellow, warning, info, grey, green]
  //     }
  //   ]
  // }
  const labels = pendingList.map(item => (item.filter ? item.filter : ''))
  const dataValues = pendingList.map(item => (item.pending_request ? parseInt(item.pending_request) : ''))

  // const labels = pendingList.map(item => {
  //   return `${item.total_request}/${item.pending_request}`
  // })

  const options = {
    responsive: true,

    maintainAspectRatio: true,
    animation: { duration: 500 },
    layout: { padding: { top: -5, bottom: -45 } },
    scales: { r: { grid: { display: false }, ticks: { display: false } } },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 25,
          boxWidth: 9,
          color: 'black',
          usePointStyle: true
        }
      }
    }
  }

  const data = {
    labels: labels,

    datasets: [
      {
        borderWidth: 0,
        label: 'Requests',
        data: dataValues,
        backgroundColor: ['#1F415B', '#37BD69', '#00D6C9', '#FFE86E', '#FA6140']
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Pending requests'
        action={
          <OptionsMenu
            iconProps={{ fontSize: 20 }}
            options={['Refresh']}
            iconButtonProps={{ size: 'small', className: 'card-more-options', sx: { color: 'text.secondary' } }}
          />
        }
      />
      <CardContent>
        <PolarArea data={data} height={350} options={options} />
      </CardContent>
    </Card>
  )
}

export default PendingRequestsChart
