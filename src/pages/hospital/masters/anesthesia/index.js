import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const Anesthesia = () => {
  return <div>Anesthesia</div>
}

export default enforceModuleAccess(Anesthesia, 'add_hospital')
