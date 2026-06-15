import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/auth.jsx'
import { Spin } from 'antd'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MainLayout from './components/MainLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminProjects from './pages/admin/Projects.jsx'
import AdminWorkstations from './pages/admin/Workstations.jsx'
import AdminMaterials from './pages/admin/Materials.jsx'
import AdminExaminers from './pages/admin/Examiners.jsx'
import AdminAppointments from './pages/admin/Appointments.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentAppointments from './pages/student/Appointments.jsx'
import StudentScores from './pages/student/Scores.jsx'
import ExaminerDashboard from './pages/examiner/Dashboard.jsx'
import ExaminerAppointments from './pages/examiner/Appointments.jsx'
import ExaminerScoring from './pages/examiner/Scoring.jsx'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  const getDefaultRoute = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'admin': return '/admin/dashboard'
      case 'examiner': return '/examiner/dashboard'
      case 'student': return '/student/dashboard'
      default: return '/login'
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/admin" element={
        <PrivateRoute roles={['admin']}>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="workstations" element={<AdminWorkstations />} />
        <Route path="materials" element={<AdminMaterials />} />
        <Route path="examiners" element={<AdminExaminers />} />
        <Route path="appointments" element={<AdminAppointments />} />
      </Route>

      <Route path="/student" element={
        <PrivateRoute roles={['student']}>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="appointments" element={<StudentAppointments />} />
        <Route path="scores" element={<StudentScores />} />
      </Route>

      <Route path="/examiner" element={
        <PrivateRoute roles={['examiner']}>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<ExaminerDashboard />} />
        <Route path="appointments" element={<ExaminerAppointments />} />
        <Route path="scoring/:id" element={<ExaminerScoring />} />
      </Route>

      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
