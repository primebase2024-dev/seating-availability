import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface User {
  id: string
  email: string
  nama_lengkap: string
  role: string
  tenant_id: string | null
}

interface Invite {
  id: string
  email: string
  role: string
  tenant_id: string | null
  status: string
  token: string
  created_at: string
}

interface Tenant {
  id: string
  nama_paroki: string
}

export default function ManageUsers() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ 
    email: '', 
    role: 'tatib',
    tenant_id: '' 
  })

  useEffect(() => { 
    fetchData() 
  }, [profile])

  async function fetchData() {
    setLoading(true)
    
    // 1. Ambil Users
    let query = supabase.from('profiles').select('*').order('nama_lengkap')
    if (profile?.role !== 'super_admin') {
      query = query.eq('tenant_id', profile?.tenant_id)
    }
    const { data: usersData } = await query
    if (usersData) setUsers(usersData)

    // 2. Ambil Undangan Pending
    let inviteQuery = supabase.from('user_invites').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (profile?.role !== 'super_admin') {
      inviteQuery = inviteQuery.eq('tenant_id', profile?.tenant_id)
    }
    const { data: invitesData } = await inviteQuery
    if (invitesData) setInvites(invitesData)

    // 3. Ambil Daftar Paroki (Khusus untuk dropdown Super Admin)
    if (profile?.role === 'super_admin') {
      const { data: tenantsData } = await supabase.from('tenants').select('id, nama_paroki').order('nama_paroki')
      if (tenantsData) setTenants(tenantsData)
    }

    setLoading(false)
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    
    // Validasi: Super admin wajib memilih paroki, Admin paroki otomatis pakai parokinya sendiri
    const finalTenantId = profile?.role === 'super_admin' 
      ? inviteForm.tenant_id 
      : profile?.tenant_id

    if (!finalTenantId) {
      return alert("Error: Tenant ID tidak ditemukan. Hubungi developer.")
    }

    const token = crypto.randomUUID()
    const payload = {
      email: inviteForm.email.toLowerCase().trim(),
      role: inviteForm.role,
      tenant_id: finalTenantId,
      invited_by: profile?.id, //  TAMBAHKAN BARIS INI
      token: token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
    }

    const { error } = await supabase.from('user_invites').insert([payload])
    
    if (error) {
      alert('Gagal mengundang: ' + error.message)
    } else {
      setShowInviteForm(false)
      setInviteForm({ email: '', role: 'tatib', tenant_id: '' })
      fetchData()
    }
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('Batalkan undangan ini?')) return
    await supabase.from('user_invites').update({ status: 'cancelled' }).eq('id', id)
    fetchData()
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/accept-invite?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Link undangan disalin! Kirimkan link ini ke email/WhatsApp pengguna.')
  }

  if (loading) return <div className="p-8 text-center">Memuat...</div>

  function sendInviteEmail(invite: Invite) {
    const link = `${window.location.origin}/accept-invite?token=${invite.token}`;
    const subject = encodeURIComponent(`Undangan Bergabung di Sistem SKTD - Paroki`);
    const body = encodeURIComponent(
`Salve, Fratres sororesque a Deo dilecti,,

Anda diundang untuk bergabung sebagai ${invite.role.toUpperCase()} di Sistem Ketersediaan Tempat Duduk (SKTD).

Silakan klik link di bawah ini untuk mengaktifkan akun dan mengatur password Anda:
${link}

Jika Anda tidak merasa diundang, abaikan email ini.

Terima kasih, Benedicti a Domino
Administrator Paroki`
    );
    
    // Membuka aplikasi email default
    window.location.href = `mailto:${invite.email}?subject=${subject}&body=${body}`;
  }
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* BAGIAN 1: PENGGUNA AKTIF */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Pengguna Terdaftar</h2>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{u.nama_lengkap || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'tatib' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>{u.role.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 text-green-600 text-sm">● Aktif</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BAGIAN 2: UNDANGAN PENDING */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Undangan Tertunda</h2>
          <button 
            onClick={() => {
              // Auto-fill tenant_id jika yang invite adalah admin paroki
              const defaultTenant = profile?.role === 'admin' ? profile.tenant_id : ''
              setShowInviteForm(true)
              setInviteForm({ email: '', role: 'tatib', tenant_id: defaultTenant })
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Undang Pengguna Baru
          </button>
        </div>
        
        {invites.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">Tidak ada undangan tertunda.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dikirim</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.email}</td>
                    <td className="px-6 py-4 text-gray-500 uppercase text-sm">{inv.role}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(inv.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
					  <button 
                        onClick={() => sendInviteEmail(inv)} 
                        className="text-green-600 hover:text-green-900 font-medium"
                        title="Buka aplikasi email untuk mengirim undangan"
                      > ✉️ Kirim Email
                      </button>
                      <button onClick={() => copyInviteLink(inv.token)} className="text-blue-600 hover:text-blue-900">📋 Copy Link</button>
                      <button onClick={() => handleDeleteInvite(inv.id)} className="text-red-600 hover:text-red-900">Batal</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM UNDANG */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Undang Pengguna Baru</h2>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Pengguna</label>
                <input 
                  required 
                  type="email" 
                  value={inviteForm.email} 
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select 
                  value={inviteForm.role} 
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="tatib">Petugas Tatib</option>
                  <option value="admin">Admin Paroki</option>
                  {profile?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              {/* 🔥 DROPDOWN PAROKI: Hanya muncul untuk Super Admin */}
              {profile?.role === 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pilih Paroki</label>
                  <select 
                    required
                    value={inviteForm.tenant_id} 
                    onChange={e => setInviteForm({ ...inviteForm, tenant_id: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="">-- Pilih Paroki --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.nama_paroki}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                Sistem akan membuat link undangan. Anda harus menyalin dan mengirimkan link tersebut secara manual kepada pengguna.
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInviteForm(false)} 
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Buat Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}