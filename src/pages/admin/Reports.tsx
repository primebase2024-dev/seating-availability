import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface AreaReport {
  area_id: string
  area_nama: string
  total_kapasitas: number
  total_tersedia: number
  total_terisi: number
  persentase: number
}

export default function Reports() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [areaReports, setAreaReports] = useState<AreaReport[]>([])
  const [summary, setSummary] = useState({ kapasitas: 0, tersedia: 0, terisi: 0, persentase: 0 })
  const [loading, setLoading] = useState(false)
  const [importFile, setImportFile] = useState(null)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchEvents()
    }
  }, [profile])

  useEffect(() => {
    if (selectedEventId) {
      fetchReportData()
    }
  }, [selectedEventId])

  async function fetchEvents() {
    const { data } = await supabase
      .from('misa_events')
      .select('id, nama, tanggal')
      .eq('tenant_id', profile?.tenant_id)
      .order('tanggal', { ascending: false })
    
    if (data && data.length > 0) {
      setEvents(data)
      setSelectedEventId(data[0].id) // Auto-select event terbaru
    }
  }

  async function fetchReportData() {
    if (!selectedEventId) return
    setLoading(true)

    // 1. Ambil Area yang Aktif untuk Event ini
    const { data: configData } = await supabase
      .from('event_area_config')
      .select('area_id, seating_areas (nama)')
      .eq('event_id', selectedEventId)
      .eq('is_active', true)

    if (!configData || configData.length === 0) {
      setAreaReports([])
      setSummary({ kapasitas: 0, tersedia: 0, terisi: 0, persentase: 0 })
      setLoading(false)
      return
    }

    const activeAreaIds = configData.map(c => c.area_id)

    // 2. Ambil Kolom beserta Statusnya
    const { data: columnsData } = await supabase
      .from('seating_columns')
      .select(`id, area_id, kapasitas, nama_display, seating_status (jumlah_tersedia, status)`)
      .in('area_id', activeAreaIds)
      .eq('is_available', true)

    // 3. Hitung Laporan per Area
    const reports: AreaReport[] = []
    let totalKapasitas = 0
    let totalTersedia = 0

    configData.forEach(config => {
      const areaId = config.area_id
      const areaNama = config.seating_areas?.nama || 'Area Tidak Diketahui'
      const areaColumns = columnsData?.filter(c => c.area_id === areaId) || []

      let areaKapasitas = 0
      let areaTersedia = 0

      areaColumns.forEach(col => {
        areaKapasitas += col.kapasitas
        
        // Logika Tersedia: Jika status null/empty, anggap penuh tersedia. Jika -1, anggap kapasitas.
        const statusData = col.seating_status?.[0]
        let available = col.kapasitas 
        
        if (statusData) {
          if (statusData.jumlah_tersedia === -1) {
            available = col.kapasitas // Aman/Penuh tersedia
          } else if (statusData.status === 'full') {
            available = 0
          } else {
            available = statusData.jumlah_tersedia
          }
        }
        areaTersedia += available
      })

      const areaTerisi = areaKapasitas - areaTersedia
      const areaPersentase = areaKapasitas > 0 ? (areaTerisi / areaKapasitas) * 100 : 0

      reports.push({
        area_id: areaId,
        area_nama: areaNama,
        total_kapasitas: areaKapasitas,
        total_tersedia: areaTersedia,
        total_terisi: areaTerisi,
        persentase: areaPersentase
      })

      totalKapasitas += areaKapasitas
      totalTersedia += areaTersedia
    })

    const totalTerisi = totalKapasitas - totalTersedia
    const totalPersentase = totalKapasitas > 0 ? (totalTerisi / totalKapasitas) * 100 : 0

    setAreaReports(reports)
    setSummary({ kapasitas: totalKapasitas, tersedia: totalTersedia, terisi: totalTerisi, persentase: totalPersentase })
    setLoading(false)
  }
	async function handleImportBackup(e) {
	  const file = e.target.files?.[0]
	  if (!file) return

	  const reader = new FileReader()
	  reader.onload = async (event) => {
		try {
		  const data = JSON.parse(event.target.result)
		  
		  // 1. Insert/Update Event Utama
		  const { id, nama, tanggal, waktu, threshold, tenant_id } = data
		  const { error: eventError } = await supabase.from('misa_events').upsert({ id, nama, tanggal, waktu, threshold, tenant_id, status: 'draft' })
		  if (eventError) throw eventError

		  alert('✅ Event berhasil di-restore! Silakan cek di menu Manajemen Event dan atur ulang Area/Tatib jika perlu.')
		  fetchEvents() // Refresh
		} catch (err) {
		  alert('❌ Gagal import: ' + err.message)
		}
	  }
	  reader.readAsText(file)
	}
  // 🔥 FITUR BACKUP: Export Data ke JSON
  async function handleExportData() {
    setLoading(true)
    const { data: exportData } = await supabase
      .from('misa_events')
      .select(`
        *, 
        event_area_config (*, seating_areas (*, seating_columns (*, seating_status (*)))),
        tatib_assignments (*, profiles (nama_lengkap, email))
      `)
      .eq('id', selectedEventId)
      .single()

    if (exportData) {
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Backup_SKTD_${exportData.nama.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      alert('✅ Data berhasil diunduh! Simpan file ini di tempat yang aman.')
    } else {
      alert('❌ Gagal mengambil data untuk backup.')
    }
    setLoading(false)
  }

  if (!events.length) return <div className="p-8 text-center text-gray-500">Belum ada Event untuk dilaporkan.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan & Statistik</h1>
            <p className="text-sm text-gray-500">Pantau estimasi kehadiran umat dan backup data event.</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={selectedEventId} 
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.nama} ({ev.tanggal})</option>
              ))}
            </select>
            <button 
              onClick={handleExportData} 
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              💾 Backup Data
            </button>
			<input 
			  type="file" 
			  id="import-json" 
			  accept=".json" 
			  className="hidden" 
			  onChange={handleImportBackup} 
			/>
			<button 
			  onClick={() => document.getElementById('import-json').click()} 
			  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium flex items-center gap-2"
			>
			  📂 Import Backup
			</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Memuat laporan...</div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 mb-1">Total Kapasitas</p>
                <p className="text-3xl font-bold text-gray-800">{summary.kapasitas.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-400 mt-2">Kursi tersedia di Area Aktif</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-sm text-gray-500 mb-1">Sisa Tersedia</p>
                <p className="text-3xl font-bold text-green-600">{summary.tersedia.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-400 mt-2">Kursi yang belum terisi</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <p className="text-sm text-gray-500 mb-1">Estimasi Umat Hadir</p>
                <p className="text-3xl font-bold text-red-600">{summary.terisi.toLocaleString('id-ID')}</p>
                <p className="text-xs text-gray-400 mt-2">Kapasitas - Tersedia</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-sm text-gray-500 mb-1">Persentase Kepenuhan</p>
                <p className="text-3xl font-bold text-purple-600">{summary.persentase.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(summary.persentase, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* TABEL DETAIL PER AREA */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-800">Rincian per Area</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Area</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kapasitas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tersedia</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Terisi (Estimasi)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {areaReports.map(area => (
                      <tr key={area.area_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{area.area_nama}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{area.total_kapasitas}</td>
                        <td className="px-6 py-4 text-right text-green-600 font-medium">{area.total_tersedia}</td>
                        <td className="px-6 py-4 text-right text-red-600 font-medium">{area.total_terisi}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            area.persentase >= 90 ? 'bg-red-100 text-red-800' :
                            area.persentase >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {area.persentase.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}