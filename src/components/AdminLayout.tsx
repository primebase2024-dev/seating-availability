import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  // Helper untuk menentukan menu aktif
  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-blue-400">Seating App</h1>
          <p className="text-xs text-slate-400 mt-1">Panel Admin Paroki</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard: Untuk Semua Admin & Super Admin */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
			<button
              onClick={() => navigate('/dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                location.pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📊</span> Dashboard
            </button>
          )}
          
          {/* Manajemen Event: Hanya Admin & Super Admin */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button
              onClick={() => navigate('/admin/parish-layout')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                location.pathname === '/admin/parish-layout' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🗺️</span> Denah Gereja
            </button>
          )}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button
              onClick={() => navigate('/admin/events')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                location.pathname.startsWith('/admin/events') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📅</span> Manajemen Event
            </button>
          )}

          {/* MENU KHUSUS SUPER ADMIN (Akan kita buat di Sprint 4) */}
          {profile?.role === 'super_admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admin</p>
              </div>
              <button
                onClick={() => navigate('/admin/paroki')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                  location.pathname.startsWith('/admin/paroki') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>⛪</span> Kelola Paroki
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                  location.pathname.startsWith('/admin/users') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>👥</span> Kelola User
              </button>
            </>
          )}
          {/* Menu Laporan (Untuk Admin & Super Admin) */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button
              onClick={() => navigate('/admin/reports')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                location.pathname === '/admin/reports' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📊</span> Laporan & Backup
            </button>
          )}		  
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{profile?.nama_lengkap}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-blue-300 uppercase">
              {profile?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}