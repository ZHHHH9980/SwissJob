import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AIAssistantFab from '@/components/AIAssistant/AIAssistantFab'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SwissJob - Your Swiss Army Knife for Job Hunting',
  description: 'The only tool you need for your job search journey. Open-source, AI-powered platform to organize applications, prepare for interviews, and land your dream job.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <AIAssistantFab />
      </body>
    </html>
  )
}
