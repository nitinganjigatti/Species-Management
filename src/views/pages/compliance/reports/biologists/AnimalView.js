import React from 'react'
import AnimalParentCard from 'src/views/utility/animalParentCard'

const AnimalView = ({ data }) => {
  return (
    <AnimalParentCard data={{
      animal: data,
      animal_id: data.animal_id,
      animal_name: data.animal_name,
      animal_number: data.animal_number,
    }} />
  )
}

export default AnimalView