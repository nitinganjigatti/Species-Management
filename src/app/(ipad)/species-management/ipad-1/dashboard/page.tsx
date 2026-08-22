'use client'

import IpadShell from 'src/views/pages/species-management/ipad1/shell/IpadShell'
import IpadDashboardContainer from 'src/components/species-management/ipad1/DashboardContainer'

const IpadDashboardPage = () => (
  <IpadShell active='dashboard'>
    <IpadDashboardContainer />
  </IpadShell>
)

export default IpadDashboardPage
