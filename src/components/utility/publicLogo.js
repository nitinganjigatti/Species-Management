import Image from 'next/image'

import logo from 'public/images/branding/antz/Antz_logo_h_color.svg'

const PublicLogo = () => {
  return (
    <>
      <Image src={logo} height={60} alt='Antz Systems' />
    </>
  )
}

export default PublicLogo
