import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils/invoiceNumber'

const getInvoiceTotal = (inv) => {
  return (inv.items || []).reduce((sum, item) => {
    return sum + ((item.area || 0) * (item.pricePerSqm || 0))
  }, 0)
}

const getInvoiceArea = (inv) => {
  return (inv.items || []).reduce((sum, item) => {
    const area = parseFloat(item.area) || 0
    return sum + area
  }, 0)
}

const getMonthLabel = (yyyyMm) => {
  if (!yyyyMm) return ''
  const [y, m] = yyyyMm.split('-')
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return `${months[parseInt(m, 10) - 1]} ${y}`
}

export const DashboardPage = () => {
  const [allInvoices, setAllInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // all, thisMonth, lastMonth, month, dateRange
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const invoices = (invoicesData || []).filter(inv => !inv.deleted_at)
      setAllInvoices(invoices)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

    return allInvoices.filter(inv => {
      const invDate = inv.issue_date || inv.created_at?.slice(0, 10) || ''
      if (!invDate) return true

      if (filterType === 'all') return true
      if (filterType === 'thisMonth') return invDate.startsWith(currentMonth)
      if (filterType === 'lastMonth') return invDate.startsWith(lastMonth)
      if (filterType === 'month' && selectedMonth) return invDate.startsWith(selectedMonth)
      if (filterType === 'dateRange') {
        if (dateFrom && invDate < dateFrom) return false
        if (dateTo && invDate > dateTo) return false
        return true
      }
      return true
    })
  }, [allInvoices, filterType, selectedMonth, dateFrom, dateTo])

  const stats = useMemo(() => {
    const total = filteredInvoices.length
    const revenue = filteredInvoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0)
    const totalSqm = filteredInvoices.reduce((sum, inv) => sum + getInvoiceArea(inv), 0)

    const currentMonth = new Date().toISOString().slice(0, 7)
    let thisMonthCount = 0
    let sqmThisMonth = 0

    filteredInvoices.forEach(inv => {
      const d = inv.issue_date || inv.created_at?.slice(0, 10) || ''
      if (d && d.startsWith(currentMonth)) {
        thisMonthCount += 1
        sqmThisMonth += getInvoiceArea(inv)
      }
    })

    return { total, thisMonth: thisMonthCount, revenue, totalSqm, sqmThisMonth }
  }, [filteredInvoices])

  const sqmByDay = useMemo(() => {
    const map = {}
    filteredInvoices.forEach(inv => {
      const d = inv.issue_date || inv.created_at?.slice(0, 10)
      if (!d) return
      if (!map[d]) {
        map[d] = { date: d, sqm: 0, count: 0 }
      }
      map[d].sqm += getInvoiceArea(inv)
      map[d].count += 1
    })

    return Object.values(map)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
  }, [filteredInvoices])

  const sqmByMonth = useMemo(() => {
    const map = {}
    filteredInvoices.forEach(inv => {
      const d = inv.issue_date || inv.created_at?.slice(0, 10)
      if (!d) return
      const key = d.slice(0, 7)
      if (!map[key]) {
        map[key] = { month: key, sqm: 0, count: 0 }
      }
      map[key].sqm += getInvoiceArea(inv)
      map[key].count += 1
    })

    return Object.values(map)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)
  }, [filteredInvoices])

  const recentInvoices = useMemo(() => filteredInvoices.slice(0, 10), [filteredInvoices])

  const availableMonths = useMemo(() => {
    const months = new Set()
    allInvoices.forEach(inv => {
      const d = inv.issue_date || inv.created_at?.slice(0, 10)
      if (d) months.add(d.slice(0, 7))
    })
    return Array.from(months).sort().reverse().slice(0, 24)
  }, [allInvoices])

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Laden...</div>
      </AdminLayout>
    )
  }

  const formatSqm = (value) => {
    return (value || 0).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-charcoal">Dashboard</h1>

        {/* Date filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-md text-sm transition ${
              filterType === 'all' ? 'bg-brand-teal text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterType('thisMonth')}
            className={`px-3 py-2 rounded-md text-sm transition ${
              filterType === 'thisMonth' ? 'bg-brand-teal text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            Dieser Monat
          </button>
          <button
            onClick={() => setFilterType('lastMonth')}
            className={`px-3 py-2 rounded-md text-sm transition ${
              filterType === 'lastMonth' ? 'bg-brand-teal text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            Letzter Monat
          </button>
          <select
            value={filterType === 'month' ? selectedMonth : ''}
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                setFilterType('month')
                setSelectedMonth(val)
              } else {
                setFilterType('all')
                setSelectedMonth('')
              }
            }}
            className="px-3 py-2 rounded-md text-sm border border-gray-300 focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">Monat wählen</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{getMonthLabel(m)}</option>
            ))}
          </select>
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Von</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  if (e.target.value || dateTo) setFilterType('dateRange')
                }}
                className="px-3 py-2 rounded-md text-sm border border-gray-300 w-36"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Bis</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  if (dateFrom || e.target.value) setFilterType('dateRange')
                }}
                className="px-3 py-2 rounded-md text-sm border border-gray-300 w-36"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setFilterType('all') }}
                className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800"
                title="Filter zurücksetzen"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {(filterType !== 'all' || dateFrom || dateTo) && (
        <p className="mb-4 text-sm text-gray-600">
          Gefiltert: {filterType === 'thisMonth' && 'Dieser Monat'}
          {filterType === 'lastMonth' && 'Letzter Monat'}
          {filterType === 'month' && selectedMonth && getMonthLabel(selectedMonth)}
          {filterType === 'dateRange' && (dateFrom || dateTo) && `${dateFrom || '...'} bis ${dateTo || '...'}`}
          {' · '}{filteredInvoices.length} Rechnungen
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/dashboard/invoices" className="bg-white rounded-lg shadow-sm border p-6 hover:border-brand-teal transition block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rechnungen gesamt</p>
              <p className="text-3xl font-bold text-brand-charcoal">{stats.total}</p>
              <p className="text-xs text-brand-teal mt-1">Rechnungen anzeigen →</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {filterType === 'thisMonth' ? 'Rechnungen in diesem Monat' : filterType !== 'all' ? 'Rechnungen im Zeitraum' : 'Rechnungen diesen Monat'}
              </p>
              <p className="text-3xl font-bold text-brand-teal">{stats.thisMonth}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {filterType !== 'all' ? 'Umsatz (Filter)' : 'Gesamtumsatz'}
              </p>
              <p className="text-3xl font-bold text-brand-amber">{formatCurrency(stats.revenue)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {filterType !== 'all' ? 'Fläche (m², Filter)' : 'Fläche (m²) gesamt'}
              </p>
              <p className="text-3xl font-bold text-brand-charcoal">
                {formatSqm(stats.totalSqm)} m²
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Diesen Monat: {formatSqm(stats.sqmThisMonth)} m²
              </p>
            </div>
            <div className="text-4xl">📐</div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-lg font-semibold">
            {filterType !== 'all' ? 'Rechnungen (gefiltert)' : 'Letzte Rechnungen'}
          </h2>
          <div className="flex gap-2">
            <Link
              to="/dashboard/invoices"
              className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-teal-700 transition text-sm font-medium"
            >
              Alle Rechnungen anzeigen
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nummer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Kunde</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Betrag</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Keine Rechnungen vorhanden
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => {
                  const total = getInvoiceTotal(invoice)

                  return (
                    <tr key={invoice.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{invoice.invoice_number}</td>
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
                        <Link
                          to={`/dashboard/invoices/${invoice.id}`}
                          className="text-brand-teal hover:text-teal-700"
                        >
                          Bearbeiten
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics: m² per day / month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Fläche pro Tag (m²)</h2>
            <p className="text-xs text-gray-500 mt-1">Letzte 30 Tage im aktuellen Filter.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">m²</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Rechnungen</th>
                </tr>
              </thead>
              <tbody>
                {sqmByDay.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      Keine Daten im aktuellen Filter
                    </td>
                  </tr>
                ) : (
                  sqmByDay.map(row => (
                    <tr key={row.date} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{row.date}</td>
                      <td className="px-6 py-3 text-sm text-right">{formatSqm(row.sqm)} m²</td>
                      <td className="px-6 py-3 text-sm text-right">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Fläche pro Monat (m²)</h2>
            <p className="text-xs text-gray-500 mt-1">Letzte 12 Monate im aktuellen Filter.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Monat</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">m²</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Rechnungen</th>
                </tr>
              </thead>
              <tbody>
                {sqmByMonth.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      Keine Daten im aktuellen Filter
                    </td>
                  </tr>
                ) : (
                  sqmByMonth.map(row => (
                    <tr key={row.month} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{getMonthLabel(row.month)}</td>
                      <td className="px-6 py-3 text-sm text-right">{formatSqm(row.sqm)} m²</td>
                      <td className="px-6 py-3 text-sm text-right">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
