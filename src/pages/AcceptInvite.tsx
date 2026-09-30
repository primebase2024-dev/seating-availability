import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [inviteData, setInviteData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) { setError('Token undangan tidak valid.'); setLoading(false); return }
    
    async function checkToken() {
      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Undangan tidak ditemukan, sudah digunakan, atau kedaluwarsa.')
      } else {
        setInviteData(data)
        setEmail(data.email) // Auto-fill email
      }
      setLoading(false)
    }
    checkToken()
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (email.toLowerCase().trim() !== inviteData?.email.toLowerCase()) {
      return setError('Email yang Anda masukkan tidak cocok dengan email undangan.')
    }

    // 1. SignUp ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama_lengkap: nama } }
    })

    if (authError) {
      console.error("🔥 DETAIL ERROR SUPABASE:", authError) // <-- TAMBAHKAN INI
      return setError(authError.message || 'Gagal membuat akun. Cek console untuk detail.')
    }

    // 2. Trigger database akan otomatis membuat profil & menandai invite sebagai 'accepted'
    setSuccess('Akun berhasil dibuat! Silakan login.')
    setTimeout(() => navigate('/login'), 2000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Memverifikasi undangan...</div>

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Undangan Tidak Valid</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Aktivasi Akun</h1>
          <p className="text-gray-600 text-sm mt-2">Anda diundang sebagai <span className="font-bold uppercase text-blue-600">{inviteData?.role}</span></p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success} Mengalihkan ke halaman login...
          </div>
        )}

        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input required value={nama} onChange={e => setNama(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Masukkan nama Anda" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Buat Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2" minLength={6} placeholder="Minimal 6 karakter" />
          </div>
          <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition">
            Aktivasi & Buat Akun
          </button>
        </form>
      </div>
    </div>
  )
}