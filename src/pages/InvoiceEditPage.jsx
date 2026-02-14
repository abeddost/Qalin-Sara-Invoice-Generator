import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { useInvoiceForm } from '../hooks/useInvoiceForm'
import { usePdfExport } from '../hooks/usePdfExport'
import { useSettings } from '../hooks/useSettings'
import { formatCurrency, formatNumber } from '../utils/invoiceNumber'
import { supabase } from '../lib/supabase'

export const InvoiceEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isViewMode = searchParams.get('mode') === 'view'
  const {
    invoice,
    loading,
    saving,
    error,
    updateField,
    updateItem,
    addItem,
    removeItem,
    calculateTotals
  } = useInvoiceForm(id)

  const { generatePdf } = usePdfExport()
  const { settings } = useSettings()
  const totals = calculateTotals()

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          service_date: invoice.service_date,
          customer_name: invoice.customer_name,
          customer_address: invoice.customer_address,
          customer_phone: invoice.customer_phone,
          payment_method: invoice.payment_method,
          anzahlung: invoice.anzahlung,
          items: invoice.items,
          status: invoice.status
        })
        .eq('id', id)

      if (error) throw error
      alert('Rechnung gespeichert!')
    } catch (err) {
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Rechnung gelöscht!')
      navigate('/dashboard/invoices')
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message)
    }
  }

  const handleGeneratePdf = () => {
    generatePdf(invoice, settings)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Laden...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-charcoal">
          {isViewMode ? 'Rechnung anzeigen' : 'Rechnung bearbeiten'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Zurück
          </button>
          {isViewMode ? (
            <button
              onClick={() => navigate(`/dashboard/invoices/${id}`)}
              className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-700"
            >
              Bearbeiten
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Löschen
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Rechnungsdaten</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rechnungsnummer</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.invoice_number}</p>
            ) : (
              <input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) => updateField('invoice_number', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rechnungsdatum</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.issue_date}</p>
            ) : (
              <input
                type="date"
                value={invoice.issue_date}
                onChange={(e) => updateField('issue_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Liefer-/Leistungsdatum</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.service_date}</p>
            ) : (
              <input
                type="date"
                value={invoice.service_date}
                onChange={(e) => updateField('service_date', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Zahlungsart</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.payment_method || '—'}</p>
            ) : (
              <select
                value={invoice.payment_method}
                onChange={(e) => updateField('payment_method', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Bar">Bar</option>
                <option value="Überweisung">Überweisung</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">
                {invoice.status === 'submitted' ? 'Eingereicht' : 'Entwurf'}
              </p>
            ) : (
              <select
                value={invoice.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">Entwurf</option>
                <option value="submitted">Eingereicht</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Kundendaten</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.customer_name || '—'}</p>
            ) : (
              <input
                type="text"
                value={invoice.customer_name}
                onChange={(e) => updateField('customer_name', e.target.value)}
                placeholder="Vor- und Nachname"
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telefon</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.customer_phone || '—'}</p>
            ) : (
              <input
                type="text"
                value={invoice.customer_phone}
                onChange={(e) => updateField('customer_phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Adresse</label>
            {isViewMode ? (
              <p className="px-3 py-2 bg-gray-50 rounded-md">{invoice.customer_address || '—'}</p>
            ) : (
              <input
                type="text"
                value={invoice.customer_address}
                onChange={(e) => updateField('customer_address', e.target.value)}
                placeholder="Straße, PLZ Ort"
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Positionen</h2>
          {!isViewMode && (
            <button
              onClick={addItem}
              className="px-4 py-2 text-sm bg-brand-teal text-white rounded-md hover:bg-teal-700 transition"
            >
              Position hinzufügen
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium">Artikel</th>
                <th className="px-3 py-2 text-right text-sm font-medium">Fläche (m²)</th>
                <th className="px-3 py-2 text-right text-sm font-medium">€/m²</th>
                <th className="px-3 py-2 text-right text-sm font-medium">Gesamt</th>
                {!isViewMode && (
                  <th className="px-3 py-2 text-center text-sm font-medium">Aktion</th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const lineTotal = (parseFloat(item.area) || 0) * (parseFloat(item.pricePerSqm) || 0)
                return (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-2">
                      {isViewMode ? (
                        <span>{item.description || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Artikel"
                          className="w-full px-2 py-1 border rounded"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isViewMode ? (
                        <span>{formatNumber(item.area || 0)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={item.area}
                          onChange={(e) => updateItem(index, 'area', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isViewMode ? (
                        <span>{formatNumber(item.pricePerSqm || 0)}</span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={item.pricePerSqm}
                          onChange={(e) => updateItem(index, 'pricePerSqm', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-right"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatNumber(lineTotal)}
                    </td>
                    {!isViewMode && (
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Entfernen
                        </button>
                      </td>
                    )}
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
              {isViewMode ? (
                <span>{formatNumber(invoice.anzahlung || 0)} €</span>
              ) : (
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
              )}
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
          onClick={handleGeneratePdf}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          PDF erstellen
        </button>
        {!isViewMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-brand-teal text-white rounded-md hover:bg-teal-700 transition disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        )}
      </div>
    </AdminLayout>
  )
}
