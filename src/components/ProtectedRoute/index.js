import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthContext } from 'src/context/AuthContext';
import { useAuth } from 'src/hooks/useAuth';

export default function withModuleAccess(PageComponent, moduleKey) {
  return function Wrapper(props) {

    const authData = useAuth(AuthContext)
    const router = useRouter();

    const accessAllowed = authData?.userData?.roles?.settings?.[moduleKey];
    console.log("authData?.userData?.roles?.settings", authData?.userData?.roles?.settings)

    useEffect(() => {
      if (!accessAllowed) {
        router.replace('/404'); // Custom 404 page
      }
    }, [accessAllowed]);

    if (!accessAllowed) return null; // Don't flash the page

    return <PageComponent {...props} />;
  };
}
