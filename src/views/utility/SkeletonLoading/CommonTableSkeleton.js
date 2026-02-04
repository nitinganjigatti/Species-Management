import { Card, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

function CommonTableSkeleton({ length = 5 }) {
  return (
    <Card
      sx={{
        my: 5,
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Skeleton width={50} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={70} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={80} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={70} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={70} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={70} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton width={70} height={24} />
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.from({ length: length }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton width={30} />
                </TableCell>
                <TableCell>
                  <Skeleton width={50} />
                </TableCell>
                <TableCell>
                  <Skeleton width='60%' />
                  <Skeleton width='40%' />
                </TableCell>
                <TableCell>
                  <Skeleton width={40} />
                </TableCell>
                <TableCell>
                  <Skeleton width={60} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton width={60} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default CommonTableSkeleton
