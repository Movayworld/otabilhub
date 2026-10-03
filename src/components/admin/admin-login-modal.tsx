'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function AdminLoginModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const clickCountRef = useRef(0)
  const lastClickTimeRef = useRef(0)
  const isOpenRef = useRef(false)

  useEffect(() => {
    const handler = () => {
      const now = Date.now()
      if (now - lastClickTimeRef.current > 3000) {
        clickCountRef.current = 1
      } else {
        clickCountRef.current += 1
      }
      lastClickTimeRef.current = now

      if (clickCountRef.current >= 5 && !isOpenRef.current) {
        setIsOpen(true)
        setError(null)
      }
    }

    window.addEventListener('adminClick', handler)
    return () => {
      window.removeEventListener('adminClick', handler)
    }
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
      clickCountRef.current = 0
      setError(null)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    clickCountRef.current = 0
    setError(null)
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success) {
        window.location.href = '/admin'
      } else {
        setError(data.error || 'Login failed.')
        setPassword('')
      }
    } catch {
      setError('An unexpected error occurred.')
    }

    setIsSubmitting(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-8 mx-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0B1F33]">Admin Login</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-[#0B1F33]">
              Email
            </label>
            <input
              type="email"
              id="admin-email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full text-sm text-[#0B1F33] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-[#0B1F33]">
              Password
            </label>
            <input
              type="password"
              id="admin-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full text-sm text-[#0B1F33] border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1677FF] focus:border-[#1677FF]"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md border border-transparent bg-[#1677FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0B3D91] focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

async function adminSignIn(email: string, password: string): Promise<{ success: boolean; error: string | null }> {
  const res = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()
  return data
}
