import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Area {
  id: string
  nama: string
  is_active: boolean // Dari event_area_config
  assigned_tatib_ids: string[] // Dari tatib_assignments
}

interface TatibUser {
  id: string
  nama_lengkap: string
  email: string
}

export default function EventSetup() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [eventName, setEventName] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [tatibUsers, setTatibUsers] = useState<TatibUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId || !profile?.tenant_id) return
    fetchData()
    fetchTatibUsers()
  }, [eventId, profile])

  async function fetchTatibUsers() {
    // Ambil semua user dengan role 'tatib' di paroki ini
    const { data } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, email')
      .eq('tenant_id', profile?.tenant_id)
      .eq('role', 'tatib')
      .order('nama_lengkap')
    
    if (data) setTatibUsers(data)
  }

  async function fetchData() {
    setLoading(true)
    
    // 1. Ambil Info Event
    const { data: eventData } = await supabase
      .from('misa_events')
      .select('nama')
      .eq('id', eventId)
      .single()
      
    if (eventData) setEventName(eventData.nama)

    // 2. Ambil SEMUA Area milik Paroki ini
    const { data: areasData } = await supabase
      .from('seating_areas')
      .select('id, nama')
      .eq('tenant_id', profile?.tenant_id)
      .order('nama')

    // 3. Ambil Konfigurasi Area yang AKTIF untuk Event ini
    const { data: configData } = await supabase
      .from('event_area_config')
      .select('area_id, is_active')
      .eq('event_id', eventId)

    // 4. Ambil Penugasan Tatib untuk Event ini
    const { data: assignmentData } = await supabase
      .from('tatib_assignments')
      .select('area_id, user_id')
      .eq('event_id', eventId)

    // Gabungkan data
    const activeAreaIds = new Set(configData?.filter(c => c.is_active).map(c => c.area_id) || [])
    const assignmentsByArea: Record<string, string[]> = {}
    assignmentData?.forEach(a => {
      if (!assignmentsByArea[a.area_id]) assignmentsByArea[a.area_id] = []
      assignmentsByArea[a.area_id].push(a.user_id)
    })

    const formattedAreas = areasData?.map(area => ({
      id: area.id,
      nama: area.nama,
      is_active: activeAreaIds.has(area.id),
      assigned_tatib_ids: assignmentsByArea[area.id] || []
    })) || []

    setAreas(formattedAreas)
    setLoading(false)
  }

  // Toggle Status Aktif Area
  async function toggleAreaActive(areaId: string, isActive: boolean) {
    const { error } = await supabase
      .from('event_area_config')
      .upsert({ event_id: eventId, area_id: areaId, is_active: isActive }, { onConflict: 'event_id,area_id' })

    if (error) {
      alert('Gagal update status area: ' + error.message)
    } else {
      // Update state lokal
      setAreas(prev => prev.map(a => a.id === areaId ? { ...a, is_active: isActive } : a))
    }
  }

  // Simpan Penugasan Tatib
  async function saveTatibAssignment(areaId: string, tatibIds: string[]) {
    // 1. Hapus penugasan lama untuk area ini
    await supabase.from('tatib_assignments').delete().eq('event_id', eventId).eq('area_id', areaId)

    // 2. Insert penugasan baru (jika ada)
    if (tatibIds.length > 0) {
      const payload = tatibIds.map(userId => ({
        event_id: eventId,
        area_id: areaId,
        user_id: userId
      }))
      
      const { error } = await supabase.from('tatib_assignments').insert(payload)
      if (error) {
        alert('Gagal menyimpan tatib: ' + error.message)
        return
      }
    }

    // Update state lokal
    setAreas(prev => prev.map(a => a.id === areaId ? { ...a, assigned_tatib_ids: tatibIds } : a))
    alert('Penugasan Tatib berhasil disimpan!')
  }

  if (loading) return <div className="p-8 text-center">Memuat Konfigurasi Event...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate('/admin/events')} className="text-sm text-blue-600 hover:underline mb-1">← Kembali</button>
          <h1 className="text-2xl font-bold text-gray-800">Konfigurasi Event: {eventName}</h1>
          <p className="text-sm text-gray-500">Pilih area yang aktif dan tugaskan petugas Tatib untuk event ini.</p>
        </div>

        <div className="space-y-4">
          {areas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow">
              Belum ada Area di Denah Gereja. Silakan setup di menu "Denah Gereja" terlebih dahulu.
            </div>
          ) : (
            areas.map(area => (
              <div key={area.id} className={`bg-white rounded-xl shadow overflow-hidden border-l-4 transition-all ${area.is_active ? 'border-green-500' : 'border-gray-300 opacity-75'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{area.nama}</h3>
                      <p className="text-xs text-gray-500">Area fisik di gereja</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={area.is_active}
                          onChange={(e) => toggleAreaActive(area.id, e.target.checked)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition ${area.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${area.is_active ? 'translate-x-6' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {area.is_active ? 'Aktif untuk Event Ini' : 'Tidak Aktif'}
                      </span>
                    </label>
                  </div>

                  {/* Bagian Penugasan Tatib (Hanya muncul jika Area Aktif) */}
                  {area.is_active && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        👮 Penugasan Petugas Tatib
                      </h4>
                      
                      {tatibUsers.length === 0 ? (
                        <p className="text-sm text-red-500 italic">Belum ada user dengan role 'tatib' di paroki ini. Silakan undang di menu Kelola User.</p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg mb-4">
                            {tatibUsers.map(user => {
                              const isSelected = area.assigned_tatib_ids.includes(user.id)
                              return (
                                <label 
                                  key={user.id} 
                                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition ${isSelected ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200 hover:bg-gray-100'}`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newIds = e.target.checked 
                                        ? [...area.assigned_tatib_ids, user.id] 
                                        : area.assigned_tatib_ids.filter(id => id !== user.id)
                                      // Update state lokal sementara
                                      setAreas(prev => prev.map(a => a.id === area.id ? { ...a, assigned_tatib_ids: newIds } : a))
                                    }}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{user.nama_lengkap}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                          
                          <div className="flex justify-end">
                            <button 
                              onClick={() => saveTatibAssignment(area.id, area.assigned_tatib_ids)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                            >
                              💾 Simpan Penugasan Area Ini
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}