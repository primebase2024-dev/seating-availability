import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function handleNavClick(path: string) {
    navigate(path)
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* 1. OVERLAY GELAP (HP only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col 
        transition-transform duration-300 ease-in-out shadow-xl
        md:relative md:translate-x-0 md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header Sidebar */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider text-blue-400">SKTD ADMIN</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📊</span> Dashboard
            </button>
          )}
          
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/parish-layout')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/parish-layout') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>🗺️</span> Denah Gereja
            </button>
          )}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/events')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/events') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📅</span> Manajemen Event
            </button>
          )}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/reports')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📈</span> Laporan & Backup
            </button>
          )}

          {profile?.role === 'super_admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admin</p>
              </div>
              <button onClick={() => handleNavClick('/admin/paroki')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/paroki') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <span>⛪</span> Kelola Paroki
              </button>
              <button onClick={() => handleNavClick('/admin/users')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/users') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <span>👥</span> Kelola User
              </button>
            </>
          )}
        </nav>

        {/* 🔥 INFO USER & TOMBOL LOGOUT (Selalu terlihat di bawah sidebar) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {profile?.nama_lengkap?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.nama_lengkap}</p>
              <p className="text-xs text-slate-400 truncate uppercase">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition shadow-lg"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* 3. AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Mobile (Hanya muncul di HP) */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-30 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-blue-600 p-1 -ml-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <span className="font-bold text-gray-800 text-lg">SKTD Panel</span>
          {/* Logout cadangan untuk HP agar lebih mudah dijangkau */}
          <button onClick={handleLogout} className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            Logout
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}