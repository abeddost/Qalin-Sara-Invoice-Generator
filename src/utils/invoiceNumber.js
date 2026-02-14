import { supabase } from '../lib/supabase'

export const getNextInvoiceNumber = async (issueDate = new Date()) => {
  try {
    const { data, error } = await supabase.rpc('next_invoice_number', {
      p_issue_date: issueDate.toISOString().split('T')[0]
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting next invoice number:', error)
    // Fallback to local generation
    const date = new Date(issueDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    return `${year}-${month}-${random}`
  }
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0)
}

export const formatNumber = (number) => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number || 0)
}
