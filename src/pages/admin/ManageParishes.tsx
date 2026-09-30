import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Tenant {
  id: string
  nama_paroki: string
  kode_paroki: string
  alamat: string
  is_active: boolean
}

export default function ManageParishes() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ nama_paroki: '', kode_paroki: '', alamat: '' })

  useEffect(() => { 
    fetchTenants() 
  }, [])

  async function fetchTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('nama_paroki')
    
    if (error) {
      console.error('Error fetching tenants:', error)
    } else if (data) {
      setTenants(data)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    let error = null
    if (editingId) {
      const res = await supabase.from('tenants').update(form).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('tenants').insert([{ ...form, is_active: true }])
      error = res.error
    }

    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      setShowForm(false)
      setEditingId(null)
      setForm({ nama_paroki: '', kode_paroki: '', alamat: '' })
      fetchTenants()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus paroki ini? Data event di dalamnya juga akan terhapus.')) {
      return
    }
    
    const { error } = await supabase.from('tenants').delete().eq('id', id)
    
    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      fetchTenants()
    }
  }

  function startEdit(tenant: Tenant) {
    setEditingId(tenant.id)
    setForm({ 
      nama_paroki: tenant.nama_paroki, 
      kode_paroki: tenant.kode_paroki, 
      alamat: tenant.alamat || '' 
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat data paroki...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER RESPONSIVE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola Data Paroki</h1>
            <p className="text-sm text-gray-500">Manajemen data paroki untuk Super Admin.</p>
          </div>
          <button 
            onClick={() => { 
              setShowForm(true)
              setEditingId(null)
              setForm({ nama_paroki: '', kode_paroki: '', alamat: '' }) 
            }}
            className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
          >
            <span>+</span> Tambah Paroki
          </button>
        </div>

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit Data Paroki' : 'Tambah Paroki Baru'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Paroki</label>
                  <input 
                    required 
                    value={form.nama_paroki} 
                    onChange={e => setForm({ ...form, nama_paroki: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" 
                    placeholder="Contoh: Paroki Santo Yosef"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode Paroki (Unik)</label>
                  <input 
                    required 
                    value={form.kode_paroki} 
                    onChange={e => setForm({ ...form, kode_paroki: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono" 
                    placeholder="contoh: paroki_santo_yosef" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                  <textarea 
                    required
                    value={form.alamat} 
                    onChange={e => setForm({ ...form, alamat: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" 
                    rows={3} 
                    placeholder="Jl. Contoh No. 1, Kota..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DESKTOP TABLE VIEW (Layar Komputer/Tablet) */}
        {/* ========================================== */}
        <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Paroki</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada data paroki. Klik "Tambah Paroki" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  tenants.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{t.nama_paroki}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm bg-gray-50 rounded w-fit">{t.kode_paroki}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={t.alamat || ''}>
                        {t.alamat || <span className="text-gray-400 italic">Belum diisi</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                        <button 
                          onClick={() => startEdit(t)} 
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)} 
                          className="text-red-600 hover:text-red-800 font-medium hover:underline"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================== */}
        {/* MOBILE CARD VIEW (HandPhone Friendly)      */}
        {/* ========================================== */}
        <div className="md:hidden space-y-4">
          {tenants.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow">
              Belum ada data paroki.
            </div>
          ) : (
            tenants.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow p-4 space-y-3 border-l-4 border-purple-500">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{t.nama_paroki}</h3>
                  <div className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                    Kode: {t.kode_paroki}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 flex items-start gap-2 pt-1">
                  <span className="mt-0.5">📍</span>
                  <span className="leading-relaxed">{t.alamat || 'Alamat belum diisi'}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => startEdit(t)} 
                    className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)} 
                    className="flex-1 py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition flex items-center justify-center gap-1"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}