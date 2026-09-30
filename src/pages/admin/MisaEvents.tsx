import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

interface MisaEvent {
  id: string
  nama: string
  tanggal: string
  waktu: string
  jenis: string
  lokasi: string
  status: string
  threshold: number
}

export default function MisaEvents() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [events, setEvents] = useState<MisaEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrEventId, setQrEventId] = useState('')
  
  const [formData, setFormData] = useState({
    nama: '', tanggal: '', waktu: '', jenis: 'Natal', lokasi: '', threshold: 20, status: 'draft'
  })

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchEvents()
    } else {
      setLoading(false)
    }
  }, [profile])

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('misa_events')
      .select('*')
      .eq('tenant_id', profile?.tenant_id)
      .order('tanggal', { ascending: false })

    if (error) console.error('Error fetching:', error)
    else setEvents(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.tenant_id) return alert("Error: Tenant ID tidak ditemukan!")

    const payload = {
      ...formData,
      tenant_id: profile.tenant_id,
      status: formData.status || 'draft'
    }

    let error = null
    if (editingId) {
      const res = await supabase.from('misa_events').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('misa_events').insert([payload])
      error = res.error
    }

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      setShowForm(false)
      setEditingId(null)
      setFormData({ nama: '', tanggal: '', waktu: '', jenis: 'Natal', lokasi: '', threshold: 20, status: 'draft' })
      fetchEvents()
    }
  }

  async function updateEventStatus(eventId: string, newStatus: string) {
    const { error } = await supabase.from('misa_events').update({ status: newStatus }).eq('id', eventId)
    if (error) {
      alert('Gagal update status: ' + error.message)
    } else {
      fetchEvents()
    }
  }

  function openQrModal(eventId: string) {
    setQrEventId(eventId)
    setShowQrModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus event ini?')) return
    
    const { error } = await supabase.from('misa_events').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      fetchEvents()
    }
  }

  function startEdit(event: MisaEvent) {
    setEditingId(event.id)
    setFormData({
      nama: event.nama,
      tanggal: event.tanggal,
      waktu: event.waktu,
      jenis: event.jenis,
      lokasi: event.lokasi,
      threshold: event.threshold,
      status: event.status || 'draft'
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Event Misa</h1>
            <p className="text-sm text-gray-500">Kelola jadwal dan konfigurasi acara.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => navigate('/dashboard')} className="flex-1 md:flex-none px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium">
              ← Kembali
            </button>
            <button 
              onClick={() => { 
                setShowForm(true)
                setEditingId(null)
                setFormData({ nama: '', tanggal: '', waktu: '', jenis: 'Natal', lokasi: '', threshold: 20, status: 'draft' }) 
              }} 
              className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Tambah Event
            </button>
          </div>
        </div>

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Event' : 'Tambah Event Baru'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Event</label>
                  <input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Misa Malam Natal" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                    <input required type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Waktu</label>
                    <input required type="time" value={formData.waktu} onChange={e => setFormData({...formData, waktu: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jenis</label>
                    <select value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                      <option value="Natal">Natal</option>
                      <option value="Paskah">Paskah</option>
                      <option value="Jumat Agung">Jumat Agung</option>
                      <option value="Minggu Palma">Minggu Palma</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                    <input required value={formData.lokasi} onChange={e => setFormData({...formData, lokasi: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Gedung Utama" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Threshold (Batas 'Hampir Penuh')</label>
                  <input required type="number" value={formData.threshold} onChange={e => setFormData({...formData, threshold: parseInt(e.target.value) || 0})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jadwal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi Cepat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada event. Klik "Tambah Event".</td></tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{event.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{event.tanggal}<br/>{event.waktu}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{event.lokasi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === 'active' ? 'bg-green-100 text-green-800' : 
                          event.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status ? event.status.toUpperCase() : 'DRAFT'}
                        </span>
                      </td>
						<td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
						  <button 
							onClick={() => {
							  navigator.clipboard.writeText(`${window.location.origin}/display/${event.id}`)
							  alert('Link Display TV disalin!')
							}} 
							className="text-indigo-600 hover:text-indigo-900 font-medium mr-2" 
							title="Copy Link Display TV"
						  >
							📺 Link
						  </button>
						  <button onClick={() => openQrModal(event.id)} className="text-purple-600 hover:text-purple-900 font-medium" title="QR Code Layar TV">📱 QR</button>
						  <select 
							value={event.status || 'draft'} 
							onChange={(e) => updateEventStatus(event.id, e.target.value)}
							className="border border-gray-300 rounded px-2 py-1 text-xs bg-white ml-2"
						  >
							<option value="draft">Draft</option>
							<option value="active">Aktif</option>
							<option value="completed">Selesai</option>
						  </select>
						</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => navigate(`/admin/events/${event.id}/setup`)} className="text-green-600 hover:text-green-900 font-semibold">Kelola Kursi</button>
                        <button onClick={() => startEdit(event)} className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden space-y-4">
          {events.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow">Belum ada event.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{event.nama}</h3>
                    <p className="text-sm text-gray-500">{event.tanggal} • {event.waktu}</p>
                    <p className="text-sm text-gray-500 mt-1">📍 {event.lokasi}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    event.status === 'active' ? 'bg-green-100 text-green-800' : 
                    event.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.status ? event.status.toUpperCase() : 'DRAFT'}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">UBAH STATUS:</p>
                  <select 
                    value={event.status || 'draft'} 
                    onChange={(e) => updateEventStatus(event.id, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white mb-3"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/display/${event.id}`)
                        alert('Link Display TV disalin!')
                      }}
                      className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100"
                    >
                      📺 Copy Link TV
                    </button>
                    <button 
                      onClick={() => openQrModal(event.id)}
                      className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
                    >
                      📱 Lihat QR Code
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => navigate(`/admin/events/${event.id}/setup`)} 
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Kelola Kursi
                    </button>
                    <button onClick={() => startEdit(event)} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================== */}
        {/* QR CODE MODAL (DENGAN DETAIL EVENT)        */}
        {/* ========================================== */}
        {showQrModal && (() => {
          const currentEvent = events.find(e => e.id === qrEventId)
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-2xl max-w-sm w-full border-t-4 border-purple-600">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">QR Code Layar TV</h3>
                
                {/* Detail Event agar tidak salah tempel/print */}
                <div className="bg-purple-50 rounded-lg p-4 mb-5 border border-purple-100">
                  <h2 className="text-xl font-black text-purple-900 leading-tight mb-2">
                    {currentEvent?.nama || 'Event Tidak Ditemukan'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-sm text-purple-700 font-semibold">
                    <span>📅 {currentEvent?.tanggal}</span>
                    <span>•</span>
                    <span>🕒 {currentEvent?.waktu}</span>
                  </div>
                  <div className="text-xs text-purple-600 mt-2 font-medium">
                    📍 {currentEvent?.lokasi}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block mb-5 shadow-sm">
                  <QRCodeSVG 
                    value={`${window.location.origin}/display/${qrEventId}`} 
                    size={220} 
                    level="H" 
                    includeMargin={true}
                  />
                </div>
                
                <p className="text-sm text-gray-600 mb-6">
                  Scan QR ini dengan HP umat untuk melihat ketersediaan kursi secara real-time.
                  <span className="text-xs text-gray-400 mt-2 block italic">
                    (Screenshot atau print halaman ini untuk ditempel di dekat layar TV)
                  </span>
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.print()} 
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center justify-center gap-2 transition"
                  >
                    🖨️ Print / Simpan
                  </button>
                  <button 
                    onClick={() => setShowQrModal(false)} 
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}