import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { isPublicDemo } from 'src/lib/auth/authMode'

const Home = () => {
  const router = useRouter()

  // Public demo: the home dashboard needs the live backend — send demo visitors
  // to the Species Management module, which runs on bundled data.
  useEffect(() => {
    if (isPublicDemo()) router.replace('/species-management/dashboard-2')
  }, [router])

  return <>Home</>
}

export default Home
