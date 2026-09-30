import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  
  // State untuk Tab
  const [activeTab, setActiveTab] = useState<'password' | 'magic'>('password')
  
  // State Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // State UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 1. Handle Login dengan Password
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      // 🔥 SMART REDIRECT BERDASARKAN ROLE
      // Kita perlu ambil profile user yang baru login untuk cek role-nya
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileData?.role === 'tatib' || profileData?.role === 'viewer') {
          navigate('/tatib-home') // Tatib langsung ke portal khusus
        } else {
          navigate('/dashboard') // Admin & Super Admin ke dashboard utama
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Kirim Magic Link (Tanpa Password)
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Setelah klik link di email, user akan diarahkan ke sini
          emailRedirectTo: `${window.location.origin}/dashboard`, 
        },
      })
      
      // 🔥 SMART REDIRECT BERDASARKAN ROLE
      // Kita perlu ambil profile user yang baru login untuk cek role-nya
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileData?.role === 'tatib' || profileData?.role === 'viewer') {
          navigate('/tatib-home') // Tatib langsung ke portal khusus
        } else {
          navigate('/dashboard') // Admin & Super Admin ke dashboard utama
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim link. Periksa kembali email Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-700 tracking-tight">SKTD</h1>
          <p className="text-gray-600 mt-2 font-medium">Masuk ke Sistem</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setActiveTab('password'); setError(''); setSuccessMessage('') }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === 'password' 
                ? 'text-blue-700 border-b-2 border-blue-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Pakai Password
          </button>
          <button
            onClick={() => { setActiveTab('magic'); setError(''); setSuccessMessage('') }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === 'magic' 
                ? 'text-blue-700 border-b-2 border-blue-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Kirim Link Email
          </button>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {/* FORM: PAKAI PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="nama@paroki.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        )}

        {/* FORM: KIRIM LINK EMAIL (MAGIC LINK) */}
        {activeTab === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-bold mb-1 flex items-center gap-2">
                <span>💡</span> Gunakan ini jika:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Anda baru diundang Admin dan belum mengatur password.</li>
                <li>Anda lupa password Anda.</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Anda</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="contoh: nama@paroki.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Mengirim...' : 'Kirim Link Login ke Email'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun? Hubungi Administrator Paroki untuk diundang.
          </p>
        </div>
      </div>
    </div>
  )
}