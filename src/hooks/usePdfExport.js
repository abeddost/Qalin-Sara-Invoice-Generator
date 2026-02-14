import { useCallback } from 'react'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { formatCurrency, formatNumber } from '../utils/invoiceNumber'

const fontVfs = pdfFonts?.pdfMake?.vfs || pdfFonts

if (fontVfs && typeof fontVfs === 'object') {
  pdfMake.vfs = fontVfs
} else {
  console.error('Failed to initialize pdfmake fonts.')
}

export const usePdfExport = () => {
  const loadLogoAsDataUrl = useCallback(() => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = function () {
        resolve(null)
      }
      img.src = '/logo.png'
    })
  }, [])

  const generatePdf = useCallback(async (invoice, settings = {}) => {
    const logoDataUrl = await loadLogoAsDataUrl()
    
    const totals = invoice.items.reduce((acc, item) => {
      const lineTotal = (parseFloat(item.area) || 0) * (parseFloat(item.pricePerSqm) || 0)
      return acc + lineTotal
    }, 0)

    const anzahlung = parseFloat(invoice.anzahlung) || 0
    const restbetrag = Math.max(0, totals - anzahlung)

    const itemRows = invoice.items.map(item => [
      { text: item.description || '', margin: [0, 2, 0, 2] },
      { text: formatNumber(parseFloat(item.area) || 0), alignment: 'right' },
      { text: formatNumber(parseFloat(item.pricePerSqm) || 0), alignment: 'right' },
      { 
        text: formatNumber((parseFloat(item.area) || 0) * (parseFloat(item.pricePerSqm) || 0)), 
        alignment: 'right' 
      }
    ])

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            { text: `Seite ${currentPage} von ${pageCount}`, alignment: 'left', fontSize: 8 },
            { text: 'Qalin Sara', alignment: 'right', fontSize: 8 }
          ],
          margin: [40, 0, 40, 20]
        }
      },
      content: [
        {
          columns: [
            [
              logoDataUrl 
                ? { image: logoDataUrl, width: 60 } 
                : { text: 'Qalin Sara', bold: true, fontSize: 16 },
              { text: 'Industriestraße 17', fontSize: 9 },
              { text: '65474 Bischofsheim', fontSize: 9 },
              { text: 'Tel: 0176 72465789', fontSize: 9 }
            ],
            [
              { text: `Rechnung Nr.: ${invoice.invoice_number || ''}`, alignment: 'right' },
              { text: `Rechnungsdatum: ${invoice.issue_date || ''}`, alignment: 'right' },
              { text: `Liefer-/Leistungsdatum: ${invoice.service_date || ''}`, alignment: 'right' }
            ]
          ]
        },
        { text: '\n' },
        { text: 'Rechnung an', bold: true, fontSize: 12, margin: [0, 0, 0, 4] },
        { text: invoice.customer_name || '' },
        { text: invoice.customer_address || '' },
        { text: invoice.customer_phone || '' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 60, 90, 90],
            body: [
              [
                { text: 'Artikel', style: 'tableHeader' },
                { text: 'Fläche (m²)', style: 'tableHeader', alignment: 'right' },
                { text: '€/m²', style: 'tableHeader', alignment: 'right' },
                { text: 'Gesamt (€)', style: 'tableHeader', alignment: 'right' }
              ],
              ...itemRows
            ]
          },
          layout: {
            fillColor: function (rowIndex) {
              return rowIndex === 0 ? '#f3f4f6' : null
            }
          }
        },
        { text: '\n' },
        {
          columns: [
            { text: '' },
            {
              table: {
                widths: [120, 90],
                body: [
                  [
                    { text: 'Gesamtsumme', bold: true }, 
                    { text: formatCurrency(totals), bold: true, alignment: 'right' }
                  ],
                  ...(anzahlung > 0 ? [
                    [
                      { text: 'Anzahlung', bold: false }, 
                      { text: formatCurrency(anzahlung), alignment: 'right' }
                    ],
                    [
                      { text: 'Restbetrag', bold: true }, 
                      { text: formatCurrency(restbetrag), bold: true, alignment: 'right' }
                    ]
                  ] : [])
                ]
              },
              layout: 'noBorders'
            }
          ]
        },
        { text: '\n' },
        invoice.payment_method 
          ? { text: `Zahlungsart: ${invoice.payment_method}` } 
          : {},
        settings.tax_id 
          ? { text: `Steuernummer/USt-IdNr.: ${settings.tax_id}` } 
          : {}
      ],
      styles: {
        tableHeader: { bold: true }
      }
    }

    pdfMake.createPdf(docDefinition).download(`${invoice.invoice_number || 'rechnung'}.pdf`)
  }, [loadLogoAsDataUrl])

  return { generatePdf }
}
