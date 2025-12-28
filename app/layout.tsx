import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🍽️ 목요점심 사다리타기',
  description: '매주 목요일, 행운의 팀은 누구? 팀 점심 사다리타기!',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="font-sans">{children}</body>
    </html>
  )
}
