import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const Monitoring = () => {
  return <div>Monitoring</div>
}

export default enforceModuleAccess(Monitoring, 'add_hospital')
