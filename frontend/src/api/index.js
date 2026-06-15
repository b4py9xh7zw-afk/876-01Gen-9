import request from './request'

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const register = (data) => {
  return request.post('/auth/register', data)
}

export const getProfile = () => {
  return request.get('/auth/profile')
}

export const getProjects = (params) => {
  return request.get('/projects', { params })
}

export const getAllProjects = () => {
  return request.get('/projects/all')
}

export const getProject = (id) => {
  return request.get(`/projects/${id}`)
}

export const createProject = (data) => {
  return request.post('/projects', data)
}

export const updateProject = (id, data) => {
  return request.put(`/projects/${id}`, data)
}

export const deleteProject = (id) => {
  return request.delete(`/projects/${id}`)
}

export const getProjectCriteria = (projectId) => {
  return request.get(`/projects/${projectId}/criteria`)
}

export const createCriteria = (projectId, data) => {
  return request.post(`/projects/${projectId}/criteria`, data)
}

export const updateCriteria = (criteriaId, data) => {
  return request.put(`/projects/criteria/${criteriaId}`, data)
}

export const deleteCriteria = (criteriaId) => {
  return request.delete(`/projects/criteria/${criteriaId}`)
}

export const getWorkstations = (params) => {
  return request.get('/workstations', { params })
}

export const getAvailableWorkstations = (params) => {
  return request.get('/workstations/available', { params })
}

export const createWorkstation = (data) => {
  return request.post('/workstations', data)
}

export const updateWorkstation = (id, data) => {
  return request.put(`/workstations/${id}`, data)
}

export const deleteWorkstation = (id) => {
  return request.delete(`/workstations/${id}`)
}

export const getMaterials = (params) => {
  return request.get('/materials', { params })
}

export const createMaterial = (data) => {
  return request.post('/materials', data)
}

export const updateMaterial = (id, data) => {
  return request.put(`/materials/${id}`, data)
}

export const deleteMaterial = (id) => {
  return request.delete(`/materials/${id}`)
}

export const getExaminers = (params) => {
  return request.get('/examiners', { params })
}

export const getAvailableExaminers = (params) => {
  return request.get('/examiners/available', { params })
}

export const createExaminer = (data) => {
  return request.post('/examiners', data)
}

export const updateExaminer = (id, data) => {
  return request.put(`/examiners/${id}`, data)
}

export const deleteExaminer = (id) => {
  return request.delete(`/examiners/${id}`)
}

export const getUsers = (params) => {
  return request.get('/users', { params })
}

export const createUser = (data) => {
  return request.post('/users', data)
}

export const updateUser = (id, data) => {
  return request.put(`/users/${id}`, data)
}

export const deleteUser = (id) => {
  return request.delete(`/users/${id}`)
}

export const getAppointments = (params) => {
  return request.get('/appointments', { params })
}

export const getAppointment = (id) => {
  return request.get(`/appointments/${id}`)
}

export const createAppointment = (data) => {
  return request.post('/appointments', data)
}

export const assignAppointment = (id, data) => {
  return request.put(`/appointments/${id}/assign`, data)
}

export const updateAppointmentStatus = (id, status) => {
  return request.put(`/appointments/${id}/status`, { status })
}

export const deleteAppointment = (id) => {
  return request.delete(`/appointments/${id}`)
}

export const getScores = (appointmentId) => {
  return request.get(`/scores/appointment/${appointmentId}`)
}

export const saveScores = (appointmentId, data) => {
  return request.post(`/scores/appointment/${appointmentId}`, data)
}

export const completeExam = (appointmentId) => {
  return request.put(`/scores/appointment/${appointmentId}/complete`)
}

export const exportScore = (appointmentId) => {
  window.open(`/api/scores/export/${appointmentId}`, '_blank')
}
