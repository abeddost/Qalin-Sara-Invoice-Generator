import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useSettings = () => {
  const [settings, setSettings] = useState({
    tax_id: '',
    bank_owner: '',
    bank_name: '',
    bank_iban: '',
    bank_bic: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      
      if (data) {
        setSettings(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    setSaving(true)
    setError(null)
    
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        // Update
        const { error } = await supabase
          .from('settings')
          .update(newSettings)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('settings')
          .insert([newSettings])
        
        if (error) throw error
      }

      setSettings(newSettings)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    refreshSettings: loadSettings
  }
}
