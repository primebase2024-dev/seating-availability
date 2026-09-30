import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // State untuk mengontrol buka/tutup sidebar di HP
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  // Fungsi helper agar sidebar otomatis tertutup saat menu diklik (di HP)
  function handleNavClick(path: string) {
    navigate(path)
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* 1. OVERLAY GELAP (Muncul hanya di HP saat sidebar terbuka) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. SIDEBAR (Responsive: Slide-in di HP, Fixed di Desktop) */}
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
          {/* Dashboard */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📊</span> Dashboard
            </button>
          )}
          
          {/* Denah Gereja */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/parish-layout')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/parish-layout') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>🗺️</span> Denah Gereja
            </button>
          )}

          {/* Manajemen Event */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/events')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/events') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📅</span> Manajemen Event
            </button>
          )}

          {/* Laporan */}
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => handleNavClick('/admin/reports')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${location.pathname.startsWith('/admin/reports') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span>📈</span> Laporan & Backup
            </button>
          )}

          {/* Menu Khusus Super Admin */}
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

        {/* Info User di Bawah Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 hidden md:block">
          <p className="text-sm font-medium text-white truncate">{profile?.nama_lengkap}</p>
          <p className="text-xs text-slate-400 truncate uppercase">{profile?.role}</p>
        </div>
      </aside>

      {/* 3. AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Mobile (Hanya muncul di HP, berisi tombol Hamburger) */}
        <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-30 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-blue-600 p-1 -ml-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <span className="font-bold text-gray-800 text-lg">SKTD Panel</span>
          <button onClick={handleLogout} className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
            Logout
          </button>
        </header>

        {/* Tempat Halaman Anak (Dashboard, Events, dll) Muncul */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}