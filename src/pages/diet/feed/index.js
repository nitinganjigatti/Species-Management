import {
  Avatar,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React from 'react'
import Router from 'next/router'

const FeedTypes = () => {
  function createData(feeds, description) {
    return { feeds, description }
  }

  const rows = [
    createData(
      'Frozen ',
      'Lorem ipsum dolor sit amet consectetur adipisicing elit.  rerum natus! Blanditiis quos ipsum accusamus sint?'
    ),
    createData(
      'Ice cream ',
      'Lorem ip ea alias, est dicta saepe a assumenda mollitia ratione nam corporis vitae aut hic, rerum natus! Blanditiis quos ipsum accusamus sint?'
    ),
    createData(
      'Eclair',
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae, ea alias, est dicta saepe a assumenda mollitia ratione nam corporis vitae aut hic, rerum natus! Blanditiis quos ipsum accusamus sint?'
    ),
    createData('Cupcake', 'Lorem ipsum dolor sit amet consectetur adipisicing elit.  accusamus sint?'),
    createData(
      'Gingerbread',
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae, ea alias, est dicta saepe a assumenda mollitia ratione nam corporis  '
    )
  ]

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 600 }} variant='h6'>
            Feed Types
          </Typography>
          <Button sx={{ px: 7 }} size='small' variant='contained' onClick={() => Router.push('/diet/add-feed')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; NEW
          </Button>
        </Box>
        <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <FormControlLabel control={<Switch defaultChecked />} label='Show Active Only' />
          <TextField
            variant='outlined'
            placeholder='Search feed'
            InputProps={{
              startAdornment: <Icon style={{ marginRight: 10 }} color='#a7a7a7' icon='mdi:search' fontSize={20} />
            }}
            sx={{ '& input': { py: 2 } }}
          />
        </Box>

        <TableContainer sx={{ border: '1px solid #e8ebf1' }}>
          <Table aria-label='simple table'>
            <TableHead>
              <TableRow sx={{ height: '56px', backgroundColor: '#E8F4F2' }}>
                <TableCell>Feeds</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align='right'></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.feeds}>
                  <TableCell sx={{ pr: 10 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar variant='square' />
                      {row.feeds}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'justify', pr: 40 }}>{row.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Icon color='#a7a7a7' icon='mdi:eye-outline' />
                      <Icon color='#a7a7a7' icon='mdi:dots-vertical' />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default FeedTypes
