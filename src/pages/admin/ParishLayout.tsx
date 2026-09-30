import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface ColumnData {
  id: string
  kode: string
  nama_display: string
  kapasitas: number
  baris: number
  kolom: string
  visible_in_display: boolean
  is_available: boolean
}

interface Area {
  id: string
  nama: string
  urutan: number
  columns: ColumnData[]
}

// Helper untuk mengubah index menjadi huruf Excel (0=A, 1=B, 2=C...)
function getLetterFromIndex(index: number) {
  return String.fromCharCode(65 + index) 
}

export default function ParishLayout() {
  const { profile } = useAuth()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  // State Form Area
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [areaForm, setAreaForm] = useState({ nama: '' })

  // State Form Kolom (Manual)
  const [showColumnForm, setShowColumnForm] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [columnForm, setColumnForm] = useState({
    kode: '', nama_display: '', kapasitas: 30, baris: 1, kolom: 'A', visible_in_display: true
  })

  // 🔥 State Baru: Form Generate Grid Otomatis
  const [showGridModal, setShowGridModal] = useState(false)
  const [targetAreaId, setTargetAreaId] = useState<string | null>(null)
  const [gridConfig, setGridConfig] = useState({ rows: 6, cols: 5 })

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData()
    }
  }, [profile])

  async function fetchData() {
    if (!profile?.tenant_id) return
    setLoading(true)

    const { data: areasData, error } = await supabase
      .from('seating_areas')
      .select(`id, nama, urutan, seating_columns (id, kode, nama_display, kapasitas, baris, kolom, visible_in_display, is_available)`)
      .eq('tenant_id', profile.tenant_id)
      .order('urutan', { ascending: true })

    if (error) {
      console.error('Error fetching areas:', error)
    } else {
      const formatted = areasData?.map(area => ({
        id: area.id,
        nama: area.nama,
        urutan: area.urutan,
        columns: (area.seating_columns as any[] || []).map((col: any) => ({
          id: col.id, kode: col.kode, nama_display: col.nama_display || col.kode,
          kapasitas: col.kapasitas, baris: col.baris || 1, kolom: col.kolom || col.kode,
          visible_in_display: col.visible_in_display ?? true,
          is_available: col.is_available
        }))
      })) || []
      setAreas(formatted)
    }
    setLoading(false)
  }

  // ===== AREA CRUD =====
  async function handleSaveArea(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.tenant_id || !areaForm.nama.trim()) return

    const payload: any = { nama: areaForm.nama, tenant_id: profile.tenant_id }
    let error = null

    if (editingAreaId) {
      const res = await supabase.from('seating_areas').update({ nama: areaForm.nama }).eq('id', editingAreaId)
      error = res.error
    } else {
      payload.urutan = areas.length + 1
      const res = await supabase.from('seating_areas').insert([payload])
      error = res.error
    }

    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      setShowAreaForm(false)
      setEditingAreaId(null)
      setAreaForm({ nama: '' })
      fetchData()
    }
  }

  async function handleDeleteArea(areaId: string) {
    if (!confirm('Hapus area ini beserta semua kolomnya?')) return
    const { error } = await supabase.from('seating_areas').delete().eq('id', areaId)
    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      fetchData()
    }
  }

  // ===== KOLOM CRUD (MANUAL) =====
  async function handleSaveColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAreaId) return

    const kolomUpper = columnForm.kolom.toUpperCase()
    const currentArea = areas.find(a => a.id === selectedAreaId)
    const isDuplicate = currentArea?.columns.some(col => {
      if (editingColumnId && col.id === editingColumnId) return false
      return col.baris === columnForm.baris && col.kolom.toUpperCase() === kolomUpper
    })

    if (isDuplicate) {
      alert(`⚠️ Gagal! Kolom "${kolomUpper}" di Baris "${columnForm.baris}" sudah ada.`)
      return
    }

    const payload = {
      area_id: selectedAreaId,
      kode: columnForm.kode.toUpperCase(),
      nama_display: columnForm.nama_display || columnForm.kode.toUpperCase(),
      kapasitas: columnForm.kapasitas,
      baris: columnForm.baris,
      kolom: kolomUpper,
      visible_in_display: columnForm.visible_in_display,
      is_available: true
    }

    let error = null
    if (editingColumnId) {
      const res = await supabase.from('seating_columns').update(payload).eq('id', editingColumnId)
      error = res.error
    } else {
      const res = await supabase.from('seating_columns').insert([payload])
      error = res.error
    }

    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      setShowColumnForm(false)
      setEditingColumnId(null)
      setSelectedAreaId(null)
      setColumnForm({ kode: '', nama_display: '', kapasitas: 30, baris: 1, kolom: 'A', visible_in_display: true })
      fetchData()
    }
  }

  async function handleDeleteColumn(columnId: string) {
    if (!confirm('Hapus kolom ini?')) return
    const { error } = await supabase.from('seating_columns').delete().eq('id', columnId)
    if (error) {
      alert('Gagal: ' + error.message)
    } else {
      fetchData()
    }
  }

  // 🔥 FITUR BARU: GENERATE GRID OTOMATIS
  async function handleGenerateGrid(e: React.FormEvent) {
    e.preventDefault()
    if (!targetAreaId) return

    const columnsToInsert = []
    // Loop Baris
    for (let r = 1; r <= gridConfig.rows; r++) {
      // Loop Kolom (Huruf)
      for (let c = 0; c < gridConfig.cols; c++) {
        const colLetter = getLetterFromIndex(c)
        columnsToInsert.push({
          area_id: targetAreaId,
          kode: `${colLetter}${r}`, // Contoh: A1, B2
          nama_display: `${colLetter}${r}`,
          kapasitas: 30, // Default kapasitas
          baris: r,
          kolom: colLetter,
          visible_in_display: true,
          is_available: true
        })
      }
    }

    const { error } = await supabase.from('seating_columns').insert(columnsToInsert)
    
    if (error) {
      alert('Gagal generate grid: ' + error.message)
    } else {
      setShowGridModal(false)
      setTargetAreaId(null)
      fetchData() // Refresh data
    }
  }

  function generateGrid(columns: ColumnData[]) {
    if (columns.length === 0) return null
    const maxBaris = Math.max(...columns.map(c => c.baris))
    const kolomList = [...new Set(columns.map(c => c.kolom))].sort()
    return { maxBaris, kolomList }
  }

  if (loading) return <div className="p-8 text-center">Memuat Denah Gereja...</div>
  if (!profile?.tenant_id) return <div className="p-8 text-center text-red-600">Akun Anda tidak terikat pada Paroki manapun.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Denah Gereja (Aset Paroki)</h1>
            <p className="text-sm text-gray-500">Atur Area dan Kolom tempat duduk fisik di gereja Anda.</p>
          </div>
          <button onClick={() => { setShowAreaForm(true); setEditingAreaId(null); setAreaForm({ nama: '' }) }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Tambah Area
          </button>
        </div>

        {/* FORM AREA */}
        {showAreaForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4">{editingAreaId ? 'Edit Area' : 'Tambah Area Baru'}</h2>
              <form onSubmit={handleSaveArea} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Area</label>
                  <input required value={areaForm.nama} onChange={e => setAreaForm({ nama: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Gedung Utama" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAreaForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔥 MODAL GENERATE GRID OTOMATIS */}
        {showGridModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-2"> Buat Grid Otomatis</h2>
              <p className="text-sm text-gray-500 mb-4">Sistem akan membuat kolom secara otomatis seperti Excel (misal: A1 sampai E6).</p>
              <form onSubmit={handleGenerateGrid} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah Baris</label>
                    <input type="number" min="1" max="50" value={gridConfig.rows}
                      onChange={e => setGridConfig({ ...gridConfig, rows: parseInt(e.target.value) || 1 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah Kolom (Huruf A-Z)</label>
                    <input type="number" min="1" max="26" value={gridConfig.cols}
                      onChange={e => setGridConfig({ ...gridConfig, cols: parseInt(e.target.value) || 1 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    <p className="text-xs text-gray-400 mt-1">5 = A, B, C, D, E</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  Total akan dibuat: <b>{gridConfig.rows * gridConfig.cols} kolom</b> 
                  <br/>(Dari <b>A1</b> sampai <b>{getLetterFromIndex(gridConfig.cols - 1)}{gridConfig.rows}</b>)
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowGridModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Generate Grid</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FORM KOLOM MANUAL */}
        {showColumnForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4">{editingColumnId ? 'Edit Kolom' : 'Tambah Kolom Baru'}</h2>
              <form onSubmit={handleSaveColumn} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kode Kolom</label>
                    <input required value={columnForm.kode} onChange={e => setColumnForm({ ...columnForm, kode: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="A, B, C..." maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Display</label>
                    <input value={columnForm.nama_display} onChange={e => setColumnForm({ ...columnForm, nama_display: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Koor 1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kapasitas</label>
                    <input required type="number" value={columnForm.kapasitas}
                      onChange={e => setColumnForm({ ...columnForm, kapasitas: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Baris</label>
                    <input required type="number" value={columnForm.baris}
                      onChange={e => setColumnForm({ ...columnForm, baris: parseInt(e.target.value) || 1 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kolom</label>
                    <input required value={columnForm.kolom} onChange={e => setColumnForm({ ...columnForm, kolom: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="A, B, C..." maxLength={2} />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="visible" checked={columnForm.visible_in_display}
                    onChange={e => setColumnForm({ ...columnForm, visible_in_display: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="visible" className="ml-2 text-sm text-gray-700">Terlihat di Display TV</label>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowColumnForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DAFTAR AREA & GRID */}
        <div className="space-y-6">
          {areas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow">Belum ada area. Klik "+ Tambah Area" untuk memulai.</div>
          ) : (
            areas.map(area => {
              const grid = generateGrid(area.columns)
              return (
                <div key={area.id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">{area.nama}</h3>
                    <div className="space-x-2">
                      <button onClick={() => handleDeleteArea(area.id)} className="text-sm text-red-600 hover:underline">️ Hapus Area</button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <h4 className="text-sm font-semibold text-gray-600 uppercase">Layout Denah</h4>
                      <div className="flex gap-2">
                        {/* 🔥 TOMBOL BARU: GENERATE GRID */}
                        <button onClick={() => { setTargetAreaId(area.id); setGridConfig({ rows: 6, cols: 5 }); setShowGridModal(true) }}
                          className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium">
                          ⚡ Buat Grid Otomatis
                        </button>
                        <button onClick={() => { setSelectedAreaId(area.id); setEditingColumnId(null); setColumnForm({ kode: '', nama_display: '', kapasitas: 30, baris: 1, kolom: 'A', visible_in_display: true }); setShowColumnForm(true) }}
                          className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          + Tambah Kolom Manual
                        </button>
                      </div>
                    </div>

                    {grid && area.columns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="border-collapse">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700"></th>
                              {grid.kolomList.map(kolom => (
                                <th key={kolom} className="border border-gray-300 bg-gray-100 px-6 py-2 text-sm font-bold text-gray-700">
                                  {kolom}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: grid.maxBaris }, (_, i) => i + 1).map(baris => (
                              <tr key={baris}>
                                <td className="border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 text-center">
                                  {baris}
                                </td>
                                {grid.kolomList.map(kolom => {
                                  const col = area.columns.find(c => c.baris === baris && c.kolom === kolom)
                                  return (
                                    <td key={`${baris}-${kolom}`} className="border border-gray-300 p-2 min-w-[120px]">
                                      {col ? (
                                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center relative group hover:border-blue-500 transition cursor-pointer"
                                          onClick={() => { setEditingColumnId(col.id); setSelectedAreaId(area.id); setColumnForm({ kode: col.kode, nama_display: col.nama_display, kapasitas: col.kapasitas, baris: col.baris, kolom: col.kolom, visible_in_display: col.visible_in_display }); setShowColumnForm(true) }}>
											<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
											  <button 
												onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id) }} 
												className="text-xs bg-red-500 text-white px-2 py-1 rounded shadow hover:bg-red-600 font-medium"
											  >
												Hapus
											  </button>
											</div>
                                          <div className="text-lg font-bold text-blue-700">{col.nama_display || col.kode}</div>
                                          <div className="text-xs text-gray-500 mt-1">{col.kapasitas} Kursi</div>
                                          {!col.visible_in_display && (
                                            <div className="text-xs text-gray-400 mt-1">👁️ Tersembunyi</div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center text-gray-400 text-sm hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition"
                                          onClick={() => { setSelectedAreaId(area.id); setEditingColumnId(null); setColumnForm({ kode: `${kolom}${baris}`, nama_display: '', kapasitas: 30, baris, kolom, visible_in_display: true }); setShowColumnForm(true) }}>
                                          + Tambah
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Belum ada kolom. Gunakan "Buat Grid Otomatis" untuk memulai dengan cepat.</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}