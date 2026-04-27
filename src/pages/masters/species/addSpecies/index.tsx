import { useRouter } from 'next/router'
import HybridAdd from 'src/components/maters/species/HybridAdd'
import SpeciesAdd from 'src/components/maters/species/SpeciesAdd'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const AddEditSpecies = () => {
  const router = useRouter()
  const { id, status, name } = router.query

  const isEditMode = !!id
  const isHybrid = status === 'hybrid'

  const handleCancel = () => {
    router.back()
  }

  return (
    <PageCardLayout
      title={isEditMode ? `Edit ${isHybrid ? 'Hybrid' : 'Species'}` : `Add ${isHybrid ? 'Hybrid' : 'Species'}`}
      showIcon={true}
      onIconClick={handleCancel}
    >
      {isHybrid ? (
        <HybridAdd isEditMode={isEditMode} id={id as string} name={name as string} onCancel={handleCancel} />
      ) : (
        <SpeciesAdd isEditMode={isEditMode} id={id as string} name={name as string} onCancel={handleCancel} />
      )}
    </PageCardLayout>
  )
}

export default AddEditSpecies
