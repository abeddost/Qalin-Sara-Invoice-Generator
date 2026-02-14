import { useState, useEffect } from 'react'
import { AdminLayout } from '../layouts/AdminLayout'
import { useSettings } from '../hooks/useSettings'

const defaultSettings = {
  tax_id: '',
  bank_owner: '',
  bank_name: '',
  bank_iban: '',
  bank_bic: ''
}

export const SettingsPage = () => {
  const { settings: loadedSettings, loading, saving, saveSettings } = useSettings()
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    if (!loading && loadedSettings) {
      setSettings({ ...defaultSettings, ...loadedSettings })
    }
  }, [loading, loadedSettings])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await saveSettings(settings)
      alert('Einstellungen gespeichert!')
    } catch (err) {
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
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
      <h1 className="text-2xl font-bold text-brand-charcoal mb-6">Einstellungen</h1>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Firmendaten</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                USt-IdNr. / Steuernummer
              </label>
              <input
                type="text"
                value={settings.tax_id || ''}
                onChange={(e) => updateField('tax_id', e.target.value)}
                placeholder="z.B. DE123456789"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional - wird auf Rechnungen angezeigt
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-md font-medium mb-3">Bankverbindung (optional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kontoinhaber
                  </label>
                  <input
                    type="text"
                    value={settings.bank_owner || ''}
                    onChange={(e) => updateField('bank_owner', e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bankname
                  </label>
                  <input
                    type="text"
                    value={settings.bank_name || ''}
                    onChange={(e) => updateField('bank_name', e.target.value)}
                    placeholder="Sparkasse Musterstadt"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={settings.bank_iban || ''}
                    onChange={(e) => updateField('bank_iban', e.target.value)}
                    placeholder="DE89 3704 0044 0532 0130 00"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={settings.bank_bic || ''}
                    onChange={(e) => updateField('bank_bic', e.target.value)}
                    placeholder="COBADEFFXXX"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-teal text-white rounded-md hover:bg-teal-700 transition disabled:opacity-50"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
