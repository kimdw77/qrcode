import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <Image src="/kitalogo.png" alt="KITA 한국무역협회" width={180} height={54} className="object-contain" />
        </div>
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
