'use client'

import IpadShell from 'src/views/pages/species-management/ipad2/shell/IpadShell'
import IpadDetailContainer from 'src/components/species-management/ipad2/DetailContainer'

const IpadSpeciesDetailPage = () => (
  <IpadShell active='species' backHref='/species-management/ipad-2/list/' backLabel='Species'>
    <IpadDetailContainer />
  </IpadShell>
)

export default IpadSpeciesDetailPage
