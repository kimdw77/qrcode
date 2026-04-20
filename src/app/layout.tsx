import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KITA 제주지부 행사',
  description: '한국무역협회 제주지부 세미나·교육 체크인',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
