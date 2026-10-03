'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Mail, Send } from 'lucide-react'

interface SettingsData {
  adminEmail: string | null
  adminPhone: string | null
  emailEnabled: boolean
  smsEnabled: boolean
  smtpHost: string | null
  smtpPort: string | null
  smtpUser: string | null
  smtpFrom: string | null
  twilioConfigured: boolean
  siteUrl: string | null
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmailEnabled, setFormEmailEnabled] = useState(true)
  const [formSmsEnabled, setFormSmsEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/admin/notification-settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data)
        setFormEmail(data.adminEmail || '')
        setFormPhone(data.adminPhone || '')
        setFormEmailEnabled(data.emailEnabled)
        setFormSmsEnabled(data.smsEnabled)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: formEmail || null,
        adminPhone: formPhone || null,
        emailEnabled: formEmailEnabled,
        smsEnabled: formSmsEnabled,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to save settings')
    } else {
      setSuccess(data.message || 'Settings saved successfully')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-gray-500">Loading notification settings…</div>
  }

  const isFullyConfigured = settings && settings.smtpHost && settings.smtpUser && settings.twilioConfigured && formEmail && formPhone

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure how you receive notifications when orders are placed and statuses change.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Admin Email (order notifications)
          </label>
          <input
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
            placeholder="admin@yourstore.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email address to receive new order alerts. Requires SMTP configuration below.
          </p>
        </div>
      </div>

      {settings?.smtpHost && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs text-gray-500">SMTP Host</span>
            <div className="font-medium text-gray-900">{settings.smtpHost}</div>
          </div>
          <div>
            <span className="text-xs text-gray-500">SMTP Port</span>
            <div className="font-medium text-gray-900">{settings.smtpPort}</div>
          </div>
          <div>
            <span className="text-xs text-gray-500">SMTP User</span>
            <div className="font-medium text-gray-900">{settings.smtpUser}</div>
          </div>
          <div>
            <span className="text-xs text-gray-500">From Email</span>
            <div className="font-medium text-gray-900">{settings.smtpFrom}</div>
          </div>
        </div>
      )}

      {!settings?.smtpHost && (
        <div className="flex items-start gap-3 p-4 rounded-md bg-yellow-50 border border-yellow-200">
          <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">SMTP not configured</p>
            <p className="text-sm text-yellow-700 mt-1">
              To receive email notifications, add SMTP credentials to your environment variables:
              <code className="block mt-1 text-xs bg-yellow-100 px-2 py-1 rounded">
                SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
              </code>
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Send size={18} /> SMS Notifications
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Admin Phone (SMS notifications)
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="+233XXXXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your phone number for SMS order alerts. Requires Twilio configuration below.
            </p>
          </div>
        </div>

        {settings?.twilioConfigured && (
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-800">Twilio is configured</span>
          </div>
        )}

        {!settings?.twilioConfigured && (
          <div className="mt-3 flex items-start gap-3 p-4 rounded-md bg-yellow-50 border border-yellow-200">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Twilio not configured</p>
              <p className="text-sm text-yellow-700 mt-1">
                To receive SMS notifications, add Twilio credentials to your environment variables:
                <code className="block mt-1 text-xs bg-yellow-100 px-2 py-1 rounded">
                  TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
                </code>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-gray-600" />
          <div>
            <span className="font-medium text-gray-900">Enable email notifications</span>
            <p className="text-sm text-gray-500">Send email alerts for new orders and status changes</p>
          </div>
        </div>
        <label className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={formEmailEnabled}
            onChange={(e) => setFormEmailEnabled(e.target.checked)}
            className="sr-only"
          />
          <div className={`inline-flex h-6 w-12 items-center rounded-full transition-colors ${formEmailEnabled ? 'bg-green-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formEmailEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Send size={20} className="text-gray-600" />
          <div>
            <span className="font-medium text-gray-900">Enable SMS notifications</span>
            <p className="text-sm text-gray-500">Send text alerts for new orders and status changes</p>
          </div>
        </div>
        <label className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={formSmsEnabled}
            onChange={(e) => setFormSmsEnabled(e.target.checked)}
            className="sr-only"
          />
          <div className={`inline-flex h-6 w-12 items-center rounded-full transition-colors ${formSmsEnabled ? 'bg-green-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formSmsEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
          </div>
        </label>
      </div>

      {isFullyConfigured && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-green-50 border border-green-200">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <p className="font-medium text-green-800">All systems configured</p>
            <p className="text-sm text-green-700">
              Order notifications will be sent via email and SMS when orders are placed or statuses change.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-800">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-800">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} variant="primary">
        {saving ? 'Saving…' : 'Save Notification Settings'}
      </Button>
    </div>
  )
}
