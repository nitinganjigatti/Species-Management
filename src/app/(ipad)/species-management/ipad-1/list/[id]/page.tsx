'use client'

import IpadShell from 'src/views/pages/species-management/ipad1/shell/IpadShell'
import IpadDetailContainer from 'src/components/species-management/ipad1/DetailContainer'

const IpadSpeciesDetailPage = () => (
  <IpadShell active='species' backHref='/species-management/ipad-1/list/' backLabel='Species'>
    <IpadDetailContainer />
  </IpadShell>
)

export default IpadSpeciesDetailPage
