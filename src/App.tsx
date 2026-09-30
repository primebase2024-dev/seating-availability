import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MisaEvents from './pages/admin/MisaEvents'
import EventSetup from './pages/admin/EventSetup'
import TatibDashboard from './pages/tatib/TatibDashboard'
import PublicDisplay from './pages/PublicDisplay'
import AdminLayout from './components/AdminLayout' // <-- Import Layout
import Landing from './pages/Landing'
import TatibHome from './pages/tatib/TatibHome' // <-- Import di atas
import ManageParishes from './pages/admin/ManageParishes'
import ManageUsers from './pages/admin/ManageUsers'
import AcceptInvite from './pages/AcceptInvite'
import ParishLayout from './pages/admin/ParishLayout'
import Reports from './pages/admin/Reports'

function PrivateRoute() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Memuat data user...</p>
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publik */}
        <Route path="/" element={<Landing />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/display/:eventId" element={<PublicDisplay />} />
         <Route path="/accept-invite" element={<AcceptInvite />} /> 
       
        {/* Privat */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
			<Route path="/admin/parish-layout" element={<ParishLayout />} />
            <Route path="/admin/events" element={<MisaEvents />} />
            <Route path="/admin/events/:eventId/setup" element={<EventSetup />} />

            {/* Menu Super Admin & Admin */}
            <Route path="/admin/users" element={<ManageUsers />} /> 
            <Route path="/admin/reports" element={<Reports />} />            
            {/* Menu Khusus Super Admin */}
            <Route path="/admin/paroki" element={<ManageParishes />} /> 

			</Route>
		  <Route path="/tatib-home" element={<TatibHome />} />
          <Route path="/tatib/:eventId/:areaId" element={<TatibDashboard />} /> 
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App