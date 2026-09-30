import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface ColumnData {
  id: string
  kode: string
  nama_display: string
  kapasitas: number
  baris: number
  kolom: string
  status: string
  jumlah_tersedia: number
}

export default function TatibDashboard() {
  // 🔥 BARU: Ambil areaId dari URL
  const { eventId, areaId } = useParams<{ eventId: string, areaId: string }>()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const [eventName, setEventName] = useState('')
  const [areaName, setAreaName] = useState('')
  const [threshold, setThreshold] = useState(20)
  const [columns, setColumns] = useState<ColumnData[]>([])
  const [loading, setLoading] = useState(true)
  
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState<number>(0)

  useEffect(() => {
    if (!eventId || !areaId || !profile) return
    fetchData()
  }, [eventId, areaId, profile])

  async function fetchData() {
    setLoading(true)
    
    // 1. Info Event
    const { data: eventData } = await supabase.from('misa_events').select('nama, threshold').eq('id', eventId).single()
    if (eventData) {
      setEventName(eventData.nama)
      setThreshold(eventData.threshold || 20)
    }

    // 2. Info Area
    const { data: areaData } = await supabase.from('seating_areas').select('nama').eq('id', areaId).single()
    if (areaData) setAreaName(areaData.nama)

    // 3. Ambil Kolom untuk Area & Event ini
    const { data: colsData } = await supabase
      .from('seating_columns')
      .select(`id, kode, nama_display, kapasitas, baris, kolom, is_available, seating_status (status, jumlah_tersedia)`)
      .eq('area_id', areaId)
      .eq('is_available', true)
      .order('baris', { ascending: true })
      .order('kolom', { ascending: true })

    if (colsData) {
      const formatted = colsData.map((col: any) => {
        const status = col.seating_status?.[0] || { status: 'available', jumlah_tersedia: -1 }
        return {
          id: col.id, kode: col.kode, nama_display: col.nama_display || col.kode,
          kapasitas: col.kapasitas, baris: col.baris || 1, kolom: col.kolom || col.kode,
          status: status.status, jumlah_tersedia: status.jumlah_tersedia
        }
      })
      setColumns(formatted)
    }
    setLoading(false)
  }

  async function updateStatus(columnId: string, jumlah: number) {
    const isGreen = jumlah === -1 || jumlah > threshold
    let status = 'available'
    if (jumlah === 0) status = 'full'
    else if (jumlah <= threshold && jumlah > 0) status = 'limited'

    const { error } = await supabase.from('seating_status').upsert({
      column_id: columnId, misa_event_id: eventId, jumlah_tersedia: jumlah,
      is_green: isGreen, status: status, updated_by: profile?.id
    }, { onConflict: 'column_id, misa_event_id' })

    if (error) alert('Gagal update: ' + error.message)
    else { setEditingColumnId(null); fetchData() }
  }

  function generateGrid(cols: ColumnData[]) {
    if (cols.length === 0) return null
    const maxBaris = Math.max(...cols.map(c => c.baris))
    const kolomList = [...new Set(cols.map(c => c.kolom))].sort()
    return { maxBaris, kolomList }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'full': return 'border-red-500 bg-red-50'
      case 'limited': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-green-500 bg-green-50'
    }
  }

  function getStatusText(col: ColumnData) {
    if (col.status === 'full') return 'PENUH'
    if (col.status === 'limited') return `Sisa ${col.jumlah_tersedia}`
    return 'Aman'
  }

  async function handleLogout() { await signOut(); navigate('/login') }

  if (loading) return <div className="p-8 text-center">Memuat data kursi...</div>

  const grid = generateGrid(columns)

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-blue-700 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div>
            <h1 className="text-lg font-bold">{eventName}</h1>
            <p className="text-sm text-blue-200">Area: <span className="font-semibold text-white">{areaName}</span></p>
            <p className="text-xs text-blue-300">Petugas: {profile?.nama_lengkap}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/tatib-home')} className="text-xs bg-blue-800 text-white px-3 py-1.5 rounded hover:bg-blue-900 font-medium">
              ← Kembali
            </button>
            <button onClick={handleLogout} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 font-medium">Logout</button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {columns.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow">Belum ada kolom di area ini.</div>
        ) : grid ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="border-collapse w-full">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 w-16"></th>
                    {grid.kolomList.map(kolom => (<th key={kolom} className="border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 min-w-[140px]">Kolom {kolom}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: grid.maxBaris }, (_, i) => i + 1).map(baris => (
                    <tr key={baris}>
                      <td className="border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 text-center">Baris {baris}</td>
                      {grid.kolomList.map(kolom => {
                        const col = columns.find(c => c.baris === baris && c.kolom === kolom)
                        const isEditing = editingColumnId === col?.id
                        return (
                          <td key={`${baris}-${kolom}`} className="border border-gray-300 p-2 align-top">
                            {col ? (
                              <div className={`rounded-lg p-3 text-center transition-all border-2 ${getStatusColor(col.status)}`}>
                                <div className="text-lg font-black text-gray-800 mb-1">{col.nama_display}</div>
                                {!isEditing ? (
                                  <>
                                    <div className={`text-xl font-bold mb-3 ${col.status === 'full' ? 'text-red-600' : col.status === 'limited' ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {getStatusText(col)}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <button onClick={() => updateStatus(col.id, -1)} className="w-full py-1.5 bg-green-600 text-white text-xs rounded font-medium hover:bg-green-700 active:scale-95 transition"> Aman</button>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => { setEditingColumnId(col.id); setInputValue(col.jumlah_tersedia === -1 ? threshold : col.jumlah_tersedia) }} className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded font-medium hover:bg-gray-50 active:scale-95 transition">✏️ Atur</button>
                                        <button onClick={() => updateStatus(col.id, 0)} className="flex-1 py-1.5 bg-red-600 text-white text-xs rounded font-medium hover:bg-red-700 active:scale-95 transition">🔴 Penuh</button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => setInputValue(prev => Math.max(0, prev - 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">-</button>
                                      <input type="number" value={inputValue} onChange={(e) => setInputValue(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 text-center text-lg font-bold border-2 border-gray-300 rounded py-1" autoFocus />
                                      <button onClick={() => setInputValue(prev => Math.min(col.kapasitas, prev + 1))} className="w-8 h-8 bg-gray-200 rounded-full font-bold hover:bg-gray-300">+</button>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button onClick={() => setEditingColumnId(null)} className="flex-1 py-1.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">Batal</button>
                                      <button onClick={() => updateStatus(col.id, inputValue)} className="flex-1 py-1.5 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700">OK</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-400 text-sm min-h-[140px] flex items-center justify-center">Kosong</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}