import toast from 'react-hot-toast'
import { AddNursery } from 'src/lib/api/egg/nursery'
import NurserySlider from 'src/views/pages/egg/nursery/NurserySlideSheet'

const NurseryAddComponent = ({ openDrawer ,closeSideSheet, setOpenDrawer, loading, fetchTableData }) => {
  return (
    <NurserySlider
    openDrawer={openDrawer}
      setOpenDrawer={setOpenDrawer}
      fetchTableData={fetchTableData}
      loading={loading}

      // onSubmit={onSubmit}
    />
  )
}

export default NurseryAddComponent
