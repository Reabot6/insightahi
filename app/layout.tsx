import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'InsightAI - AI-Powered Documentation Assistant by Reabot6',
  description: 'Stop reading lengthy documentation. Paste any docs URL and chat with AI to get instant answers, code examples, and best practices. Your personal AI tutor for learning and development. © 2025 Reabot6',
  generator: 'Reabot6',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'InsightAI - AI-Powered Documentation Assistant by Reabot6',
    description: 'Turn documentation and PDFs into instant answers with AI. © 2025 Reabot6',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightAI - AI-Powered Documentation Assistant by Reabot6',
    description: 'Turn documentation and PDFs into instant answers with AI. © 2025 Reabot6',
    images: ['/og-image.jpg'],
  },
}

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
        <div className="fixed bottom-2 right-2 text-xs text-slate-600 pointer-events-none z-50 font-mono">
          © 2025 Reabot6
        </div>
      </body>
    </html>
  )
}
