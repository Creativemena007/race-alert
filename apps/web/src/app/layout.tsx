import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Race Alert - Never Miss Marathon Registration Again',
  description: 'Get notified when registration opens for major marathons worldwide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}