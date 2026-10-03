'use client'

import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'

type ConsentValue = 'all' | 'essential' | 'custom'

const CONSENT_KEY = 'otabilhub-cookie-consent'
const CONSENT_EXPIRY_DAYS = 365

function getExpiryDate(): string {
  const d = new Date()
  d.setTime(d.getTime() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  return d.toUTCString()
}

function setConsentCookie(value: ConsentValue, preferences: Record<string, boolean>): void {
  const cookieStr = `${CONSENT_KEY}=${value}; expires=${getExpiryDate()}; path=/; SameSite=Lax`
  const prefsStr = `${CONSENT_KEY}-prefs=${encodeURIComponent(JSON.stringify(preferences))}; expires=${getExpiryDate()}; path=/; SameSite=Lax`
  document.cookie = cookieStr
  document.cookie = prefsStr
}

function getStoredConsent(): { value: ConsentValue; prefs: Record<string, boolean> } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(CONSENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState(defaultPreferences)

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      setIsVisible(true)
    }
  }, [])

  const acceptAll = () => {
    const value: ConsentValue = 'all'
    const prefs = { essential: true, analytics: true, marketing: true }
    const record = { value, prefs }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
    setConsentCookie(value, prefs)
    setIsVisible(false)
  }

  const acceptEssential = () => {
    const value: ConsentValue = 'essential'
    const prefs = { essential: true, analytics: false, marketing: false }
    const record = { value, prefs }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
    setConsentCookie(value, prefs)
    setIsVisible(false)
  }

  const saveCustom = () => {
    const value: ConsentValue = 'custom'
    const prefs = { ...preferences, essential: true }
    const record = { value, prefs }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
    setConsentCookie(value, prefs)
    setShowCustomize(false)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-safe pb-4">
        <div className="rounded-xl border border-gray-300/50 bg-[#F5F7FA] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Cookie size={18} className="text-[#1677FF] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#0B1F33]">
                We use cookies to improve your experience, analyze traffic, and show relevant offers. See our{' '}
                <a
                  href="/cookie-policy"
                  className="text-[#1677FF] underline hover:text-[#0B3D91]"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowCustomize(false)}
                >
                  Cookie Policy
                </a>
                .
              </p>

              {showCustomize && (
                <div className="mt-3 space-y-2 border-t border-gray-300/30 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[#0B1F33]">Essential Cookies</label>
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="rounded border-gray-300 text-[#1677FF]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[#0B1F33]">Analytics Cookies</label>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="rounded border-gray-300 text-[#1677FF]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[#0B1F33]">Marketing Cookies</label>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="rounded border-gray-300 text-[#1677FF]"
                    />
                  </div>
                </div>
              )}

              {!showCustomize ? (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={acceptAll}
                    className="flex items-center justify-center gap-2 rounded-md bg-[#1677FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D91]"
                  >
                    Accept All
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptEssential}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B1F33] transition-colors hover:bg-gray-100"
                    >
                      Reject Non-Essential
                    </button>
                    <button
                      onClick={() => setShowCustomize(true)}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B1F33] transition-colors hover:bg-gray-100"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={saveCustom}
                    className="flex-1 rounded-md bg-[#1677FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D91]"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => setShowCustomize(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B1F33] transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
