import React from 'react'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const Dashboard: React.FC = () => {
  return <>dashboard page</>
}

export default enforceModuleAccess(Dashboard, 'enable_housing_in_web')
