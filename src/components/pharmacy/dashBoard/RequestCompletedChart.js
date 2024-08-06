import { forwardRef, useState, useEffect } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'

// ** Third Party Imports
import format from 'date-fns/format'
import { Bar } from 'react-chartjs-2'
import DatePicker from 'react-datepicker'
import OptionsMenu from 'src/@core/components/option-menu'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getCompletedRequestsList } from 'src/lib/api/pharmacy/dashboard'
import { display, grid } from '@mui/system'

const RequestCompletedChart = props => {
  // ** Props
  const { yellow, labelColor, borderColor } = props

  // ** States
  const [completedRequest, setCompletedRequest] = useState([])

  const getAllCompletedRequestList = async () => {
    try {
      const result = await getCompletedRequestsList()

      if (result?.success === true && result?.data) {
        setCompletedRequest(result?.data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getAllCompletedRequestList()
  }, [])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    scales: {
      x: {
        grid: { color: borderColor },
        ticks: { color: labelColor }
      },
      y: {
        min: 0,
        max: 400,
        grid: {
          color: borderColor
        },
        ticks: {
          stepSize: 100,
          color: labelColor
        }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }

  // const data = {
  //   labels: [
  //     '7/12',
  //     '8/12',
  //     '9/12',
  //     '10/12',
  //     '11/12',
  //     '12/12',
  //     '13/12',
  //     '14/12',
  //     '15/12',
  //     '16/12',
  //     '17/12',
  //     '18/12',
  //     '19/12'
  //   ],
  //   datasets: [
  //     {
  //       maxBarThickness: 15,
  //       backgroundColor: yellow,
  //       borderColor: 'transparent',
  //       borderRadius: { topRight: 15, topLeft: 15 },
  //       data: [275, 90, 190, 205, 125, 85, 55, 87, 127, 150, 230, 280, 190]
  //     }
  //   ]
  // }
  const months = completedRequest.map(item => (item.month ? item.month : ''))
  const counters = completedRequest.map(item => (item.counter ? parseInt(item.counter) : ''))

  const data = {
    labels: months,
    datasets: [
      {
        maxBarThickness: 15,
        backgroundColor: 'green',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: counters
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Requests completed'
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <OptionsMenu
            iconProps={{ fontSize: 20 }}
            options={['Refresh']}
            iconButtonProps={{ size: 'small', className: 'card-more-options', sx: { color: 'text.secondary' } }}
          />
        }
      />

      <CardContent>
        <Bar data={data} height={400} options={options} />
      </CardContent>
    </Card>
  )
}

export default RequestCompletedChart
