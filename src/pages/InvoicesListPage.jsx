import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils/invoiceNumber'

export const InvoicesListPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, draft, submitted, deleted
  const [searchName, setSearchName] = useState('')
  const [searchAmount, setSearchAmount] = useState('')

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (err) {
      console.error('Error loading invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteInvoice = async (id) => {
    if (!window.confirm('Rechnung in den Papierkorb verschieben?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, deleted_at: new Date().toISOString() } : inv
      ))
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message)
    }
  }

  const restoreInvoice = async (id) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) throw error
      
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, deleted_at: null } : inv
      ))
    } catch (err) {
      alert('Fehler beim Wiederherstellen: ' + err.message)
    }
  }

  const getInvoiceTotal = (inv) => {
    return (inv.items || []).reduce((sum, item) => {
      return sum + ((item.area || 0) * (item.pricePerSqm || 0))
    }, 0)
  }

  const activeInvoices = invoices.filter(inv => !inv.deleted_at)
  const deletedInvoices = invoices.filter(inv => !!inv.deleted_at)

  const filteredInvoices = (filter === 'deleted' ? deletedInvoices : activeInvoices).filter(inv => {
    // Status filter (only for non-deleted view)
    if (filter !== 'all' && filter !== 'deleted' && inv.status !== filter) return false

    // Search by customer name
    if (searchName.trim()) {
      const name = (inv.customer_name || '').toLowerCase()
      const query = searchName.trim().toLowerCase()
      if (!name.includes(query)) return false
    }

    // Search by amount (min)
    if (searchAmount !== '' && searchAmount !== null) {
      const minAmount = parseFloat(searchAmount)
      if (!Number.isNaN(minAmount) && getInvoiceTotal(inv) < minAmount) return false
    }

    return true
  })

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
        <h1 className="text-2xl font-bold text-brand-charcoal">Rechnungen</h1>
        <Link
          to="/invoice"
          className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-700 transition"
        >
          Neue Rechnung erstellen
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Suche nach Name</label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Kundenname eingeben..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Betrag ab (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
            placeholder="z.B. 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          />
        </div>
        {(searchName || searchAmount) && (
          <button
            onClick={() => { setSearchName(''); setSearchAmount('') }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Zurücksetzen
          </button>
        )}
      </div>
      {filteredInvoices.length !== (filter === 'deleted' ? deletedInvoices : activeInvoices).length && (
        <p className="mb-4 text-sm text-gray-600">
          {filteredInvoices.length} von {filter === 'deleted' ? deletedInvoices.length : activeInvoices.length} Rechnungen
        </p>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'all'
              ? 'bg-brand-teal text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Alle ({activeInvoices.length})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'draft'
              ? 'bg-brand-teal text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Entwürfe ({activeInvoices.filter(i => i.status === 'draft').length})
        </button>
        <button
          onClick={() => setFilter('submitted')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'submitted'
              ? 'bg-brand-teal text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Eingereicht ({activeInvoices.filter(i => i.status === 'submitted').length})
        </button>
        <button
          onClick={() => setFilter('deleted')}
          className={`px-4 py-2 rounded-md transition ${
            filter === 'deleted'
              ? 'bg-gray-600 text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Papierkorb ({deletedInvoices.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nummer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Kunde</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Betrag</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Keine Rechnungen gefunden
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const total = getInvoiceTotal(invoice)

                  return (
                    <tr key={invoice.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">{invoice.customer_name}</td>
                      <td className="px-6 py-4 text-sm">{invoice.issue_date}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'submitted' ? 'Eingereicht' : 'Entwurf'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-3">
                          {filter === 'deleted' ? (
                            <button
                              onClick={() => restoreInvoice(invoice.id)}
                              className="text-brand-teal hover:text-teal-700"
                            >
                              Wiederherstellen
                            </button>
                          ) : (
                            <>
                              <Link
                                to={`/dashboard/invoices/${invoice.id}?mode=view`}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                Anzeigen
                              </Link>
                              <Link
                                to={`/dashboard/invoices/${invoice.id}`}
                                className="text-brand-teal hover:text-teal-700"
                              >
                                Bearbeiten
                              </Link>
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Löschen
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
