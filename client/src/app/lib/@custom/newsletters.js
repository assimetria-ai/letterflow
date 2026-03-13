import { api } from '../@system/api'

export const newslettersApi = {
  list({ status, limit, offset } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (limit != null) params.set('limit', String(limit))
    if (offset != null) params.set('offset', String(offset))
    const qs = params.toString()
    return api.get(`/newsletters${qs ? `?${qs}` : ''}`)
  },

  get(id) {
    return api.get(`/newsletters/${id}`)
  },

  create(data) {
    return api.post('/newsletters', data)
  },

  update(id, data) {
    return api.put(`/newsletters/${id}`, data)
  },

  schedule(id, scheduled_at) {
    return api.patch(`/newsletters/${id}/schedule`, { scheduled_at })
  },

  remove(id) {
    return api.delete(`/newsletters/${id}`)
  },
}
