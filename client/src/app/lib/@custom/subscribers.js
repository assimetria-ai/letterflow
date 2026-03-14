// @custom — API helper for subscriber import/export endpoints
import { api } from '../@system/api'

const API_BASE = ''

export const subscribersApi = {
  getStats() {
    return api.get('/subscribers/stats')
  },

  getHistory() {
    return api.get('/subscribers/import/history')
  },

  async preview(file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/api/subscribers/import/preview`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Preview failed')
    return data
  },

  async import(file, fieldMapping) {
    const formData = new FormData()
    formData.append('file', file)
    if (fieldMapping) {
      formData.append('fieldMapping', JSON.stringify(fieldMapping))
    }
    const res = await fetch(`${API_BASE}/api/subscribers/import`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Import failed')
    return data
  },

  async exportSubscribers(filters = {}) {
    const params = new URLSearchParams(filters)
    const qs = params.toString()
    const res = await fetch(`${API_BASE}/api/subscribers/export${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Export failed')
    return res.blob()
  },

  async exportCampaigns() {
    const res = await fetch(`${API_BASE}/api/subscribers/export/campaigns`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Export failed')
    return res.blob()
  },
}
