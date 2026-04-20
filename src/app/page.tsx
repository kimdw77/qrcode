import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-brand-700 mb-2">KITA 제주지부</h1>
        <p className="text-gray-500 mb-8">행사 체크인 시스템</p>
        <p className="text-sm text-gray-400">
          QR 코드를 스캔하거나 운영자에게 문의하세요.
        </p>
        <div className="mt-12 border-t pt-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">
            관리자 로그인
          </Link>
        </div>
      </div>
    </main>
  )
}
