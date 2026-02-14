import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmployeeLayout } from '../layouts/EmployeeLayout'
import { useInvoiceForm } from '../hooks/useInvoiceForm'
import { usePdfExport } from '../hooks/usePdfExport'
import { useSettings } from '../hooks/useSettings'
import { formatCurrency, formatNumber } from '../utils/invoiceNumber'

export const InvoicePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    invoice,
    loading,
    saving,
    error,
    updateField,
    updateItem,
    addItem,
    removeItem,
    calculateTotals,
    saveDraft,
    submitInvoice,
    clearForm
  } = useInvoiceForm(id)

  const { generatePdf } = usePdfExport()
  const { settings } = useSettings()
  const totals = calculateTotals()

  const handleGeneratePdf = async () => {
    if (!invoice.customer_name || !invoice.invoice_number) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    try {
      // Save to backend with submitted status
      await submitInvoice()
      // Generate PDF
      generatePdf(invoice, settings)
      // Clear form for next invoice
      setTimeout(() => {
        clearForm()
      }, 500)
    } catch (err) {
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="text-center py-12">Laden...</div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Firmendaten</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Qalin Sara</div>
            <div>Industriestraße 17</div>
            <div>65474 Bischofsheim</div>
            <div>Tel: 0176 72465789</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Rechnungsdaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rechnungsnummer</label>
              <input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) => updateField('invoice_number', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rechnungsdatum</label>
              <input
                type="date"
                value={invoice.issue_date}
                onChange={(e) => updateField('issue_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Liefer-/Leistungsdatum</label>
              <input
                type="date"
                value={invoice.service_date}
                onChange={(e) => updateField('service_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Zahlungsart</label>
            <select
              value={invoice.payment_method}
              onChange={(e) => updateField('payment_method', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Bar">Bar</option>
              <option value="Überweisung">Überweisung</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Kundendaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={invoice.customer_name}
                onChange={(e) => updateField('customer_name', e.target.value)}
                placeholder="Vor- und Nachname"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <input
                type="text"
                value={invoice.customer_phone}
                onChange={(e) => updateField('customer_phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Adresse</label>
              <input
                type="text"
                value={invoice.customer_address}
                onChange={(e) => updateField('customer_address', e.target.value)}
                placeholder="Straße, PLZ Ort"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Positionen</h2>
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-brand-teal text-white rounded-md hover:bg-teal-700 transition"
            >
              Position hinzufügen
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium">Artikel</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">Fläche (m²)</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">€/m²</th>
                  <th className="px-3 py-2 text-right text-sm font-medium">Gesamt</th>
                  <th className="px-3 py-2 text-center text-sm font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const lineTotal = (parseFloat(item.area) || 0) * (parseFloat(item.pricePerSqm) || 0)
                  return (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Artikel"
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.area}
                          onChange={(e) => updateItem(index, 'area', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.pricePerSqm}
                          onChange={(e) => updateItem(index, 'pricePerSqm', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatNumber(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/2 bg-gray-50 rounded-md p-4 space-y-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Gesamtsumme</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Anzahlung</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.anzahlung}
                    onChange={(e) => updateField('anzahlung', e.target.value)}
                    className="w-32 px-2 py-1 border rounded text-right"
                  />
                  <span>€</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Restbetrag</span>
                <span>{formatCurrency(totals.restbetrag)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            onClick={clearForm}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Formular leeren
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={saving}
            className="px-6 py-3 bg-brand-amber text-white rounded-md hover:bg-amber-600 transition disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : 'PDF erstellen'}
          </button>
        </div>
      </div>
    </EmployeeLayout>
  )
}
