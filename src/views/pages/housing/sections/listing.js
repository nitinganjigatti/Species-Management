import { Card, CardHeader } from '@mui/material'

const Listing = ({ title }) => {
  return (
    <>
      <Card>
        <CardHeader title={title} />
      </Card>
    </>
  )
}
export default Listing
