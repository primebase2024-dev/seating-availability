import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 md:p-12 text-center">
        {/* Judul Utama */}
        <h1 className="text-3xl md:text-4xl font-black text-blue-900 mb-4 tracking-wide">
          SISTEM KETERSEDIAAN TEMPAT DUDUK
        </h1>
        
        {/* Teks Latin */}
        <p className="text-blue-700 italic text-lg mb-6 font-serif">
          Salve, Fratres sororesque a Deo dilecti,
        </p>

        {/* Deskripsi */}
        <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-8">
          SKTD ini dibangun untuk membantu pelayanan Ekaristi di paroki agar 
          memudahkan umat untuk melihat ketersediaan tempat duduk di area gereja.
        </p>

        {/* Tombol Masuk */}
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-lg font-bold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          Masuk Sistem
        </button>

        {/* Footer Note */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 leading-relaxed">
            Sudah mendapat undangan dari Administrator Paroki Harapan Indah?
            <br />
            Silakan login, lalu atur password Anda melalui menu dashboard.
          </p>
          <p className="text-sm text-blue-700 italic mt-3 font-serif">
            Selamat melayani. Benedicti a Domino.
          </p>
        </div>
      </div>
    </div>
  )
}