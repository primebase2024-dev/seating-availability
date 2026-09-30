import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Selamat Datang, {profile?.nama_lengkap}!
        </h1>
        <p className="text-gray-500 mt-1">
          {isSuperAdmin 
            ? "Panel Kontrol Pusat: Kelola semua paroki dan pengguna dari sini." 
            : "Panel Administrasi Paroki: Kelola event dan penugasan petugas."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Manajemen Event (Untuk Admin & Super Admin) */}
        {(isAdmin || isSuperAdmin) && (
          <div 
            onClick={() => navigate('/admin/events')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition">📅</div>
              <h2 className="text-xl font-bold text-gray-800">Manajemen Event Misa</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Buat, edit, atau hapus jadwal Misa. Atur Area, Kolom, dan tugaskan Petugas Tatib.
            </p>
          </div>
        )}

        {/* Card 2: Kelola Paroki (Khusus Super Admin) */}
        {isSuperAdmin && (
          <div 
            onClick={() => navigate('/admin/paroki')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 cursor-pointer transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition">⛪</div>
              <h2 className="text-xl font-bold text-gray-800">Kelola Data Paroki</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Tambah paroki baru, atur administrator paroki, dan lihat ringkasan global.
            </p>
          </div>
        )}

        {/* Card 3: Kelola User (Khusus Super Admin) */}
        {isSuperAdmin && (
          <div 
            onClick={() => navigate('/admin/users')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 cursor-pointer transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition">👥</div>
              <h2 className="text-xl font-bold text-gray-800">Kelola Pengguna</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Undang administrator paroki baru atau kelola hak akses sistem secara global.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}