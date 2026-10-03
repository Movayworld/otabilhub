'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, User, Clock, MessageSquare, Search, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  read: boolean
  created_at: string
}

type FilterType = 'all' | 'unread' | 'read'

export default function AdminContactContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadMessages = async () => {
    setLoading(true)
    setError(null)
    setDeleteError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter !== 'all') params.set('filter', filter)
      const res = await fetch(`/api/admin/contact-messages?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      } else {
        setError('Failed to load messages')
      }
    } catch {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMessages() }, [search, filter])

  const handleMarkRead = async (id: string, read: boolean) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read }),
      })
      if (res.ok) {
        loadMessages()
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    setConfirmDelete(null)
    setDeleteError(null)
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        loadMessages()
      } else {
        setDeleteError('Failed to delete message')
      }
    } catch {
      setDeleteError('Failed to delete message')
    } finally {
      setActionLoading(null)
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

  const selectedMessage = messages.find(m => m.id === expanded)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Contact Messages
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage messages from the public contact form.
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-600">{deleteError}</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search name, email, subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">Loading messages...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadMessages}>
            Retry
          </Button>
        </div>
      ) : messages.length === 0 ? (
        <div className="p-12 text-center border border-gray-200 rounded-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <MessageSquare size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No contact messages yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sender</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{msg.name}</p>
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          {msg.email}
                        </a>
                        {msg.phone && (
                          <p className="text-xs text-gray-500">{msg.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {msg.subject ? (
                      <span className="text-gray-700">{msg.subject}</span>
                    ) : (
                      <span className="text-gray-400 italic">No subject</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {new Date(msg.created_at).toLocaleDateString('en-GH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}{' '}
                      {new Date(msg.created_at).toLocaleTimeString('en-GH', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {msg.read ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Unread
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant={msg.read ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleMarkRead(msg.id, !msg.read)}
                        disabled={actionLoading === msg.id}
                        className="px-2"
                        title={msg.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {msg.read ? (
                          <Mail size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                        className="px-2"
                        title="View message"
                      >
                        <MessageSquare size={14} />
                      </Button>
                      {confirmDelete === msg.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(msg.id)}
                            disabled={actionLoading === msg.id}
                            className="px-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setConfirmDelete(null); setDeleteError(null) }}
                            className="px-2"
                          >
                            <XCircle size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setConfirmDelete(msg.id); setDeleteError(null) }}
                          className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expanded && selectedMessage && (
        <div className="mt-6 border border-gray-200 rounded-md p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedMessage.subject || 'No subject'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(null)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">From</p>
              <p className="font-medium text-gray-900">{selectedMessage.name}</p>
              <a
                href={`mailto:${selectedMessage.email}`}
                className="text-green-600 hover:text-green-700"
              >
                {selectedMessage.email}
              </a>
            </div>
            <div>
              <p className="text-gray-500">Message</p>
              <p className="text-gray-900 whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="text-gray-900">
                {new Date(selectedMessage.created_at).toLocaleDateString('en-GH', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}{' '}
                {new Date(selectedMessage.created_at).toLocaleTimeString('en-GH', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
