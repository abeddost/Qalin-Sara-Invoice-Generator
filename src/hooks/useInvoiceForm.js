import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getNextInvoiceNumber } from '../utils/invoiceNumber'

export const useInvoiceForm = (invoiceId = null) => {
  const [invoice, setInvoice] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    service_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    payment_method: 'Bar',
    anzahlung: 0,
    items: [{ description: '', area: 0, pricePerSqm: 0 }],
    status: 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing invoice
  useEffect(() => {
    if (invoiceId) {
      loadInvoice(invoiceId)
    } else {
      initializeNewInvoice()
    }
  }, [invoiceId])

  const loadInvoice = async (id) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setInvoice({
        ...data,
        items: data.items || [{ description: '', area: 0, pricePerSqm: 0 }]
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const initializeNewInvoice = async () => {
    const invoiceNumber = await getNextInvoiceNumber()
    setInvoice(prev => ({ ...prev, invoice_number: invoiceNumber }))
  }

  const updateField = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setInvoice(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', area: 0, pricePerSqm: 0 }]
    }))
  }

  const removeItem = (index) => {
    setInvoice(prev => {
      const newItems = prev.items.filter((_, i) => i !== index)
      return {
        ...prev,
        items: newItems.length > 0 ? newItems : [{ description: '', area: 0, pricePerSqm: 0 }]
      }
    })
  }

  const calculateTotals = useCallback(() => {
    const subtotal = invoice.items.reduce((sum, item) => {
      const area = parseFloat(item.area) || 0
      const price = parseFloat(item.pricePerSqm) || 0
      return sum + (area * price)
    }, 0)

    const anzahlung = parseFloat(invoice.anzahlung) || 0
    const restbetrag = Math.max(0, subtotal - anzahlung)

    return { subtotal, anzahlung, restbetrag }
  }, [invoice.items, invoice.anzahlung])

  const saveDraft = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const invoiceData = {
        ...invoice,
        created_by: user.id,
        status: 'draft'
      }

      if (invoiceId) {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)
        
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single()
        
        if (error) throw error
        return data.id
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const submitInvoice = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const invoiceData = {
        ...invoice,
        created_by: user.id,
        status: 'submitted'
      }

      if (invoiceId) {
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'submitted' })
          .eq('id', invoiceId)
        
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
          .single()
        
        if (error) throw error
        return data.id
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const clearForm = () => {
    setInvoice({
      invoice_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      service_date: new Date().toISOString().split('T')[0],
      customer_name: '',
      customer_address: '',
      customer_phone: '',
      payment_method: 'Bar',
      anzahlung: 0,
      items: [{ description: '', area: 0, pricePerSqm: 0 }],
      status: 'draft'
    })
    initializeNewInvoice()
  }

  return {
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
  }
}
