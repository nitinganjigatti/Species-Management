'use client'

import IpadShell from 'src/views/pages/species-management/ipad3/shell/IpadShell'
import IpadDetailContainer from 'src/components/species-management/ipad3/DetailContainer'

const IpadSpeciesDetailPage = () => (
  <IpadShell active='species' backHref='/species-management/ipad-3/list/' backLabel='Species'>
    <IpadDetailContainer />
  </IpadShell>
)

export default IpadSpeciesDetailPage
