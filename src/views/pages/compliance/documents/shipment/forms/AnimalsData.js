import React, { useState } from 'react'
import SpeciesDetailsContainer from '../view-component/SpeciesDetails'
import SpeciesAddEdit from '../view-component/SpeciesAddEdit'

const AnimalsData = ({ onEditClick, showEditAnimals, setShowEditAnimals }) => {
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [exportPermitDrawerOpen, setexportPermitDrawerOpen] = useState(false)
  const [linkedShipmentsDrawerOpen, setLinkedShipmentsDrawerOpen] = useState(false)

  const handleSave = () => {
    // setShowEditAnimals(false) // on save, hide edit
  }

  const handleEditClick = () => {
    setShowEditAnimals(true) // triggered from parent
  }

  const handleLinkedshipmentClick = () => {
    setLinkedShipmentsDrawerOpen(true)
  }

  // listen to parent instruction to trigger edit mode
  React.useEffect(() => {
    if (onEditClick) onEditClick.current = handleEditClick
  }, [onEditClick])

  return (
    <>
      {showEditAnimals ? (
        <SpeciesAddEdit
          onSave={handleSave}
          onCancel={() => setShowEditAnimals(false)}
          handleLinkedshipmentClick={handleLinkedshipmentClick}
          speciesDrawerOpen={speciesDrawerOpen}
          linkedShipmentsDrawerOpen={linkedShipmentsDrawerOpen}
          setLinkedShipmentsDrawerOpen={setLinkedShipmentsDrawerOpen}
          setSpeciesDrawerOpen={setSpeciesDrawerOpen}
          setexportPermitDrawerOpen={setexportPermitDrawerOpen}
          exportPermitDrawerOpen={exportPermitDrawerOpen}
        />
      ) : (
        <SpeciesDetailsContainer />
      )}
    </>
  )
}

export default AnimalsData
