import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import Utility from 'src/utility'

const ShipmentPrintComponent = forwardRef(({ data }, ref) => {
  const printRef = useRef()
  const [printedDate, setPrintedDate] = useState('')

  // Expose the handlePrint method to the parent component
  useImperativeHandle(ref, () => ({
    handlePrint
  }))

  const handlePrint = () => {
    // Update the printed date and time before printing
    const currentDate = new Date()

    const formattedDate = currentDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    setPrintedDate(formattedDate)

    // Create a custom filename with shipment ID
    const shipmentTitle = `Shipment_Details_${data?.shipment_id || ''}`

    // Create an iframe for printing
    const originalTitle = document.title
    document.title = shipmentTitle
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const image =
      process.env.NEXT_PUBLIC_BRANDING === 'antz'
        ? '/images/branding/antz/Antz_logomark_h_color.svg'
        : '/images/branding/vantara/Weblogo_vantara.png'

    const printContents = printRef.current.innerHTML

    // Get all stylesheets
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n')
        } catch (e) {
          console.warn('Error accessing stylesheet:', e)

          return ''
        }
      })
      .join('\n')

    iframe.contentDocument.write(`
        <html>
            <head>
                <title>${shipmentTitle}</title>
                <style>
                    /* Include global styles */
                    ${styles}
                    /* Additional print-specific styles */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            position: relative;
                            min-height: 100vh;
                        }
                        .printable-container {
                            background-color: #f5f5f5 !important;
                            padding: 16px !important;
                            border-radius: 8px !important;
                            border: 1px solid #e0e0e0 !important;
                            margin-top: 16px !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        table th, table td {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        svg, path, circle {
                            color-adjust: exact !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        /* Hide browser default header and footer */
                        @page {
                            size: auto;
                            margin: 0;
                        }
                        /* Hide date/time elements */
                        .print-date, .date-time {
                            display: none !important;
                        }
                        /* Custom footer styles */
                        .custom-footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            width: 100%;
                            padding: 10px 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 14px;
                            color: #666;
                            background-color: white;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                        .footer-left {
                            display: flex;
                            align-items: center;
                            padding: 20px;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                        .footer-icon {
                            margin-right: 8px;
                            font-size: 16px;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                        .footer-right {
                            text-align: right;
                        }
                        main {
                            margin-bottom: 50px;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                        .img {
                           width: 60px;
                           height: 60px;
                           object-fit: contain;
                           page-break-after: avoid;
                           page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <main>
                    ${printContents}
                </main>
                <div class="custom-footer">
                    <div class="footer-left">
                        <span class="footer-icon">
                            <img src=${image} alt="Antz Logo" width="auto" height="30" />
                        </span>
                        <span>Generated by ${
                          process.env.NEXT_PUBLIC_BRANDING === 'antz' ? 'Antz Systems' : 'Vantara'
                        }</span>
                    </div>
                    </div>
                </div>
            </body>
        </html>
    `)

    iframe.contentDocument.close()

    // Add a small delay to ensure content is loaded
    iframe.onload = () => {
      setTimeout(() => {
        // Set the filename for the "Save as" option
        iframe.contentWindow.document.title = shipmentTitle

        // Trigger the print dialog
        iframe.contentWindow.print()

        // Restore the original title after printing
        document.title = originalTitle

        // Remove the iframe after printing
        document.body.removeChild(iframe)
      }, 300)
    }
  }

  // const handlePrint = () => {
  //   // Update the printed date and time before printing
  //   const currentDate = new Date()
  //   const formattedDate = currentDate.toLocaleString('en-GB', {
  //     day: '2-digit',
  //     month: '2-digit',
  //     year: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     hour12: true
  //   })
  //   setPrintedDate(formattedDate)

  //   // Create a custom filename with shipment ID
  //   const shipmentTitle = `Shipment_Details_${data?.shipment_id || ''}`

  //   // Instead of iframe, we'll use a different approach for better filename control
  //   const printWindow = window.open('', '_blank')
  //   printWindow.document.title = shipmentTitle

  //   if (!printWindow) {
  //     alert('Please allow popups for this website to print shipment details.')
  //     return
  //   }

  //   const printContents = printRef.current.innerHTML

  //   // Get all stylesheets
  //   const styles = Array.from(document.styleSheets)
  //     .map(sheet => {
  //       try {
  //         return Array.from(sheet.cssRules)
  //           .map(rule => rule.cssText)
  //           .join('\n')
  //       } catch (e) {
  //         console.warn('Error accessing stylesheet:', e)
  //         return ''
  //       }
  //     })
  //     .join('\n')

  //   printWindow.document.write(`
  //       <html>
  //           <head>
  //               <title>${shipmentTitle}</title>
  //               <style>
  //                   /* Include global styles */
  //                   ${styles}
  //                   /* Additional print-specific styles */
  //                   @media print {
  //                       body {
  //                           margin: 0;
  //                           padding: 0;
  //                           -webkit-print-color-adjust: exact !important;
  //                           print-color-adjust: exact !important;
  //                           color-adjust: exact !important;
  //                       }
  //                       .printable-container {
  //                           background-color: #f5f5f5 !important;
  //                           padding: 16px !important;
  //                           border-radius: 8px !important;
  //                           border: 1px solid #e0e0e0 !important;
  //                           margin-top: 16px !important;
  //                           -webkit-print-color-adjust: exact !important;
  //                           print-color-adjust: exact !important;
  //                       }
  //                       table th, table td {
  //                           -webkit-print-color-adjust: exact !important;
  //                           print-color-adjust: exact !important;
  //                           color-adjust: exact !important;
  //                       }
  //                       svg, path, circle {
  //                           color-adjust: exact !important;
  //                           -webkit-print-color-adjust: exact !important;
  //                           print-color-adjust: exact !important;
  //                       }
  //                       .footer {
  //                           position: fixed;
  //                           bottom: 16px;
  //                           width: 100%;
  //                           display: flex;
  //                           justify-content: center;
  //                           align-items: center;
  //                           font-size: 14px;
  //                           color: #666;
  //                       }
  //                       .footer-logo {
  //                           width: 30px;
  //                           height: 30px;
  //                           display: flex;
  //                           justify-content: center;
  //                           align-items: center;
  //                           margin-right: 10px;
  //                       }
  //                   }
  //               </style>
  //           </head>
  //           <body>
  //               <div>
  //                   ${printContents}
  //               </div>
  //               <div class="footer">
  //                   <div class="footer-logo">
  //                       <img src="/images/branding/Antz_logomark_h_color.svg" alt="Antz Logo" width="30" height="30" />
  //                   </div>
  //                   <span>Generated by Antz Systems</span>
  //               </div>
  //               <script>
  //                   // This script will run in the new window
  //                   window.onload = function() {
  //                       // Set the document title again (for the filename)
  //                       document.title = "${shipmentTitle}";

  //                       // Add a small delay to ensure content is loaded
  //                       setTimeout(function() {
  //                           window.print();
  //                           // Close the window after printing (can be removed if you want it to stay open)
  //                           window.addEventListener('afterprint', function() {
  //                               window.close();
  //                           });
  //                       }, 500);
  //                   }
  //               </script>
  //           </body>
  //       </html>
  //   `)

  //   printWindow.document.close()
  // }

  return (
    <div>
      <div ref={printRef}>
        <ShipmentDetails data={data} printedDate={printedDate} />
      </div>
    </div>
  )
})

const ShipmentDetails = ({ data, printedDate }) => {
  const currentDate = new Date()

  const formattedDate =
    printedDate ||
    currentDate.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

  const image =
    process.env.NEXT_PUBLIC_BRANDING === 'antz'
      ? '/images/branding/antz/Antz_logo_color.svg'
      : '/images/branding/vantara/Weblogo_vantara_V.png'

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        maxWidth: '1000px',
        margin: 'auto',
        backgroundColor: 'white',
        color: '#333',
        boxSizing: 'border-box',
        paddingTop: '40px'
      }}
    >
      {/* Header with logo and shipment ID */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#034739',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '15px'
          }}
        >
          <img src={image} alt='Antz Logo' width='40' height='40' />
          {/* <span
            style={{
              background:
                'linear-gradient(180deg, #CCC692 -35.62%, #CBC38D -28.12%, #C7B273 24.41%, #C3A863 45.04%, #BD913F 78.81%, #A4823E 118.21%, #A1813E 121.96%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '32px',
              fontWeight: 'bold'
            }}
          >
            V
          </span> */}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 5px 0', fontWeight: 'normal', color: '#1b5e20' }}>
            Shipment ID - {data.shipment_id}
          </h1>
          <p style={{ fontSize: '14px', margin: '0', color: '#666' }}>Printed on {formattedDate}</p>
        </div>
      </div>

      {/* Divider */}
      <hr style={{ border: 'none', height: '1px', backgroundColor: '#dddddd', margin: '20px 0' }} />

      {/* Two-column layout for shipment and vehicle details */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          backgroundColor: '#5C987E1A',
          padding: '20px',
          borderRadius: '5px'
        }}
      >
        {/* Left column - Shipment Details */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '16px', marginTop: '0', marginBottom: '15px', color: '#44544A', fontWeight: 600 }}>
            Shipment Details
          </h2>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Reference No:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.request_number}</div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Ordered By:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>
              {data.created_by_user_name || 'NA'}
            </div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Shipped From:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.from_store_name}</div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Shipped To:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.to_store_name}</div>
          </div>
        </div>

        {/* Right column - Vehicle Details */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '16px', marginTop: '0', marginBottom: '15px', color: '#44544A', fontWeight: 600 }}>
            Vehicle Details
          </h2>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Driver Name:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.person_shipping}</div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Shipped Date:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>
              {Utility.formatDisplayDate(data.shipment_date)}
            </div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Vehicle Number:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.vehicle_no}</div>
          </div>

          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '130px', color: '#7A8684', fontSize: '14px', fontWeight: 400 }}>Mobile No.:</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>{data.phone_number}</div>
          </div>
        </div>
      </div>

      {/* Items table header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#034739',
          color: '#FFFFFF',
          padding: '8px 15px',
          fontWeight: 500,
          fontSize: '14px'
        }}
      >
        <div>
          Items Shipped: <span style={{ fontWeight: 700 }}>{data?.item_details.length}</span>
        </div>
        <div>
          Carton Boxes: <span style={{ fontWeight: 700 }}>{data?.carton_box}</span>
        </div>
      </div>

      {/* Items table with borders */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '20px',
          fontSize: '14px',
          border: '1px solid #ddd'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#5C987E1A', fontWeight: 500, color: '#44544A', fontSize: '14px' }}>
            <th
              style={{
                padding: '8px 15px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                border: '1px solid #ddd'
              }}
            >
              S.No.
            </th>
            <th
              style={{
                padding: '8px 15px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                border: '1px solid #ddd'
              }}
            >
              Product Name
            </th>
            <th
              style={{
                padding: '8px 15px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                border: '1px solid #ddd'
              }}
            >
              Batch ID
            </th>
            <th
              style={{
                padding: '8px 15px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                border: '1px solid #ddd'
              }}
            >
              Quantity
            </th>
            <th
              style={{
                padding: '8px 15px',
                textAlign: 'left',
                borderBottom: '1px solid #ddd',
                border: '1px solid #ddd'
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.item_details?.map((item, index) => (
            <tr key={item.id}>
              <td
                style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  border: '1px solid #ddd'
                }}
              >
                {item.uid}
              </td>
              <td
                style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  border: '1px solid #ddd'
                }}
              >
                {item.stock_name}
              </td>
              <td
                style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  border: '1px solid #ddd'
                }}
              >
                {item.batch_no}
              </td>
              <td
                style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                  border: '1px solid #ddd'
                }}
              >
                {item.count}
              </td>
              <td
                style={{
                  padding: '8px 15px',
                  borderBottom: '1px solid #ddd',
                  border: '1px solid #ddd'
                }}
              >
                {item?.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ShipmentPrintComponent
