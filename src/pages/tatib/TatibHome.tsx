import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Assignment {
  id: string
  event_id: string
  area_id: string
  event_nama: string
  event_tanggal: string
  area_nama: string
}

export default function TatibHome() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchAssignments()
  }, [profile])

  async function fetchAssignments() {
    // 🔥 BARU: Ambil dari tabel tatib_assignments
    const { data, error } = await supabase
      .from('tatib_assignments')
      .select(`
        id, event_id, area_id,
        misa_events (nama, tanggal),
        seating_areas (nama)
      `)
      .eq('user_id', profile.id)

    if (error) console.error(error)
    else {
      const formatted = data?.map(item => ({
        id: item.id,
        event_id: item.event_id,
        area_id: item.area_id,
        event_nama: item.misa_events.nama,
        event_tanggal: item.misa_events.tanggal,
        area_nama: item.seating_areas.nama
      })) || []
      setAssignments(formatted)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Memuat tugas...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Portal Petugas Tatib</h1>
          <p className="text-xs text-blue-200">Halo, {profile?.nama_lengkap}</p>
        </div>
        <button onClick={handleLogout} className="text-xs bg-red-600 px-3 py-1.5 rounded hover:bg-red-700">Logout</button>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Tugas Anda</h2>
        
        {assignments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            <p>Belum ada penugasan untuk akun Anda.</p>
            <p className="text-sm mt-2">Silakan hubungi Administrator Paroki.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((task) => (
              <div 
                key={task.id} 
                onClick={() => navigate(`/tatib/${task.event_id}/${task.area_id}`)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700">{task.event_nama}</h3>
                  <p className="text-sm text-gray-500">{task.event_tanggal}</p>
                  <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    📍 Area: {task.area_nama}
                  </div>
                </div>
                <div className="text-blue-600 text-2xl group-hover:translate-x-1 transition">→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}