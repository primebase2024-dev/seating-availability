import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ColumnData {
  id: string
  kode: string
  nama_display: string
  baris: number
  kolom: string
  status: string
  jumlah_tersedia: number
}

interface AreaData {
  id: string
  nama: string
  columns: ColumnData[]
}

export default function PublicDisplay() {
  const { eventId } = useParams<{ eventId: string }>()
  
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [areas, setAreas] = useState<AreaData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    fetchData()
    
    // Realtime listener
    const channel = supabase
      .channel('seating-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seating_status', filter: `misa_event_id=eq.${eventId}` }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  async function fetchData() {
    setLoading(true)
    
    // 1. Info Event
    const { data: eventData } = await supabase.from('misa_events').select('nama, tanggal, waktu').eq('id', eventId).single()
    if (eventData) {
      setEventName(eventData.nama)
      setEventDate(eventData.tanggal)
      setEventTime(eventData.waktu)
    }

    // 2.  BARU: Ambil Area yang AKTIF untuk Event ini dari event_area_config
    const { data: activeConfig } = await supabase
      .from('event_area_config')
      .select('area_id, seating_areas (id, nama)')
      .eq('event_id', eventId)
      .eq('is_active', true)

    if (!activeConfig || activeConfig.length === 0) {
      setAreas([])
      setLoading(false)
      return
    }

    const activeAreaIds = activeConfig.map(c => c.area_id)

    // 3. Ambil Kolom untuk Area-area yang aktif tersebut
    const { data: colsData } = await supabase
      .from('seating_columns')
      .select(`id, area_id, kode, nama_display, baris, kolom, visible_in_display, is_available, seating_status (status, jumlah_tersedia)`)
      .in('area_id', activeAreaIds)
      .eq('is_available', true)
      .eq('visible_in_display', true)
      .order('baris', { ascending: true })
      .order('kolom', { ascending: true })

    if (colsData) {
      const grouped: Record<string, AreaData> = {}
      
      colsData.forEach((col: any) => {
        // Cari nama area dari data config
        const areaConfig = activeConfig.find(c => c.area_id === col.area_id)
        const areaName = areaConfig?.seating_areas?.nama || 'Area Lain'
        const areaId = col.area_id
        const status = col.seating_status?.[0] || { status: 'available', jumlah_tersedia: -1 }

        if (!grouped[areaId]) {
          grouped[areaId] = { id: areaId, nama: areaName, columns: [] }
        }

        grouped[areaId].columns.push({
          id: col.id, kode: col.kode, nama_display: col.nama_display || col.kode,
          baris: col.baris || 1, kolom: col.kolom || col.kode,
          status: status.status, jumlah_tersedia: status.jumlah_tersedia
        })
      })

      setAreas(Object.values(grouped))
    }
    setLoading(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'full': return 'bg-red-500 text-white'
      case 'limited': return 'bg-yellow-400 text-black'
      case 'unavailable': return 'bg-gray-400 text-white'
      default: return 'bg-green-500 text-white'
    }
  }

  function getStatusText(col: ColumnData) {
    if (col.status === 'full') return 'PENUH'
    if (col.status === 'limited') return `SISA ${col.jumlah_tersedia}`
    if (col.status === 'unavailable') return 'TUTUP'
    return 'TERSEDIA'
  }

  function generateGrid(columns: ColumnData[]) {
    if (columns.length === 0) return null
    const maxBaris = Math.max(...columns.map(c => c.baris))
    const kolomList = [...new Set(columns.map(c => c.kolom))].sort()
    return { maxBaris, kolomList }
  }

  if (loading) return <div className="min-h-screen bg-blue-900 flex items-center justify-center"><h1 className="text-4xl font-bold text-white animate-pulse">Memuat Data Kursi...</h1></div>

  return (
    <div className="min-h-screen bg-blue-900 text-white overflow-hidden flex flex-col">
      <header className="bg-blue-800 p-6 text-center shadow-lg z-20">
        <h1 className="text-4xl font-bold tracking-wide mb-2">KETERSEDIAAN TEMPAT DUDUK</h1>
        <h2 className="text-2xl font-semibold text-blue-200">{eventName || 'Event Tidak Ditemukan'}</h2>
        <p className="text-xl text-blue-300 mt-1">{eventDate} | Pukul {eventTime}</p>
      </header>

      <div className="flex-1 flex items-center relative overflow-hidden py-10">
        {areas.length === 0 ? (
          <div className="w-full text-center text-white text-2xl">Belum ada Area yang diaktifkan untuk Event ini oleh Admin.</div>
        ) : (
          <div className="scroll-container w-full overflow-hidden">
            <div className="scroll-content flex gap-8 animate-marquee">
              {[...areas, ...areas].map((area, index) => {
                const grid = generateGrid(area.columns)
                return (
                  <div key={`${area.id}-${index}`} className="bg-blue-800 rounded-2xl p-6 min-w-[600px] shadow-xl border border-blue-700 flex-shrink-0">
                    <h3 className="text-3xl font-bold text-center mb-6 text-yellow-400">{area.nama}</h3>
                    <div className="bg-white text-blue-900 rounded-lg px-8 py-3 mb-6 mx-auto w-fit shadow-lg">
                      <div className="text-center"><div className="text-2xl mb-1">✝️</div><div className="font-bold text-lg">ALTAR</div></div>
                    </div>
                    {grid && (
                      <div className="overflow-x-auto">
                        <table className="border-collapse w-fit mx-auto">
                          <thead>
                            <tr>
                              <th className="border-2 border-blue-600 bg-blue-700 px-4 py-2 text-sm font-bold"></th>
                              {grid.kolomList.map(kolom => (<th key={kolom} className="border-2 border-blue-600 bg-blue-700 px-6 py-2 text-lg font-bold min-w-[120px]">{kolom}</th>))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: grid.maxBaris }, (_, i) => i + 1).map(baris => (
                              <tr key={baris}>
                                <td className="border-2 border-blue-600 bg-blue-700 px-4 py-3 text-lg font-bold text-center min-w-[50px]">{baris}</td>
                                {grid.kolomList.map(kolom => {
                                  const col = area.columns.find(c => c.baris === baris && c.kolom === kolom)
                                  return (
                                    <td key={`${baris}-${kolom}`} className="border-2 border-blue-600 p-2">
                                      {col ? (
                                        <div className={`rounded-lg p-4 flex flex-col items-center justify-center shadow-md transition-all ${getStatusColor(col.status)}`}>
                                          <span className="text-xs font-medium opacity-80 mb-1">KOLOM</span>
                                          <span className="text-2xl font-black mb-1">{col.nama_display}</span>
                                          <span className="text-sm font-bold tracking-wider">{getStatusText(col)}</span>
                                        </div>
                                      ) : (
                                        <div className="bg-blue-900/50 rounded-lg p-4 flex items-center justify-center min-h-[100px]"><span className="text-blue-600 text-2xl">-</span></div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-blue-950 p-4 flex justify-center gap-8 text-xl font-semibold z-20 border-t border-blue-800">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-green-500"></div> Tersedia Banyak</div>
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-yellow-400"></div> Hampir Penuh</div>
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-red-500"></div> Penuh</div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 50s linear infinite; }
        .scroll-content:hover { animation-play-state: paused; }
      `}</style>
    </div>
  )
}