import React from 'react'
import Image from 'next/image'
import welcomeToAntz from 'public/images/intro_antz_all.jpg'

function Dashboard() {
  return (
    <div style={{ textAlign: 'center' }}>
      <Image
        src={welcomeToAntz}
        style={{ maxWidth: '600px', width: '100%', height: 'calc(100vh - 180px)', objectFit: 'contain' }}
        alt='Welcome to Antz'
      />
    </div>
  )
}

export default Dashboard
