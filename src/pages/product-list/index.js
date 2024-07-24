// import { Typography } from '@mui/material'
import React from 'react'

// import BlankLayout from 'src/@core/layouts/BlankLayout'
// import { Link } from '@mui/material'
// import Slider from 'react-slick'
// import Router from 'next/router'
// import 'slick-carousel/slick/slick.css'
// import 'slick-carousel/slick/slick-theme.css'

// const ProductList = () => {
//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 900,
//     slidesToShow: 3,
//     slidesToScroll: 2,
//     centerMode: true,
//     centerPadding: '0px', // Adjust as needed
//     customPaging: i => <div className='custom-dot'></div>,
//     beforeChange: (current, next) => setActiveSlide(next),
//     autoplay: false, // Enable auto-scrolling
//     autoplaySpeed: 3000,
//     responsive: [
//       {
//         breakpoint: 1024,
//         settings: {
//           slidesToShow: 2,
//           slidesToScroll: 2,
//           infinite: true,
//           dots: true
//         }
//       },
//       {
//         breakpoint: 820,
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1,
//           initialSlide: 1
//         }
//       },
//       {
//         breakpoint: 600,
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1,
//           initialSlide: 1
//         }
//       }
//     ]
//   }

//   const [activeSlide, setActiveSlide] = React.useState(0)

//   const slides = [
//     {
//       image: '/images/Pharmacy1.png',
//       text: 'Pharmacy Module',
//       desc: 'Experience efficiency at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Learn More'
//     },
//     {
//       image: '/images/Lab1.png',
//       text: 'Lab Module',
//       desc: 'Experience efficiency1 at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Explore'
//     },
//     {
//       image: '/images/Diet1.png',
//       text: 'Diet Module',
//       desc: 'Experience efficiency2 at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Get Started'
//     },
//     {
//       image: '/images/Pharmacy1.png',
//       text: 'Pharmacy Module Again',
//       desc: 'Experience efficiency at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Read More'
//     },
//     {
//       image: '/images/Lab1.png',
//       text: 'Lab Module Again',
//       desc: 'Experience efficiency at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Discover'
//     },
//     {
//       image: '/images/Diet1.png',
//       text: 'Diet Module Again',
//       desc: 'Experience efficiency at your fingertips with dashboard. Explore stock, inventory, and orders effortlessly. Lets elevate your pharmacy management!',
//       button: 'Join Now'
//     }

//     // Add more slides here
//   ]

//   const SkipLinkClick = () => {
//     Router.push('/login')
//   }

//   return (
//     <div className='container'>
//       <div className='logo'>
//         <img src='/images/branding/Antz_logo_color.svg' alt='Antz Logo' />
//       </div>
//       <div className='content'>
//         <Typography sx={{ fontSize: 50, color: '#37BD69', fontWeight: 500 }}>Welcome to Antz Systems</Typography>
//         <Typography sx={{ fontSize: 24, color: '#fff' }}>
//           Select your desired module to access insightful overviews and <br /> efficient management tools.
//         </Typography>
//       </div>
//       <Link className='skip-link' onClick={SkipLinkClick}>
//         Skip
//       </Link>
//       <div className='slider-container'>
//         <Slider {...settings}>
//           {slides.map((slide, index) => (
//             <div key={index} className={activeSlide === index ? 'notblurred-image' : 'blurred-image'}>
//               <img src={slide.image} alt={`Slide ${index + 1}`} />
//               <div className={`overlay ${activeSlide === index ? 'always-show' : ''}`}>
//                 <Typography variant='h5' className='overlay-text' sx={{ color: '#fff', pb: 2 }}>
//                   {slide.text}
//                 </Typography>
//                 <Typography className='overlay-text' sx={{ color: '#fff', fontSize: '13px', mb: 2 }}>
//                   {slide.desc}
//                 </Typography>
//                 <button className='overlay-button'>{slide.button}</button>
//               </div>
//             </div>
//           ))}
//         </Slider>
//       </div>
//     </div>
//   )
// }

// ProductList.getLayout = page => <BlankLayout>{page}</BlankLayout>
// ProductList.guestGuard = true

// export default ProductList

const ProductList = () => {
  return <div></div>
}

export default ProductList
