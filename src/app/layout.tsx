import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentUser } from '@/lib/supabase/auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartProvider } from '@/components/cart/cart-context'
import { getSiteBranding } from '@/lib/queries/branding'
import { CookieConsentBanner } from '@/components/ui/cookie-consent'
import { AdminLoginModal } from '@/components/admin/admin-login-modal'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export async function generateMetadata(): Promise<Metadata> {
  const { icon_path } = await getSiteBranding()

  return {
    title: {
      default: 'OtabilHub',
      template: '%s | OtabilHub',
    },
    description: 'Premium electronics, technology, and smart-home products with professional installation services.',
    keywords: ['electronics', 'smart home', 'gadgets', 'installations'],
    icons: icon_path
      ? {
          icon: [{ url: icon_path, sizes: 'any', type: 'image/png' }],
          apple: [{ url: icon_path, sizes: 'any' }],
        }
      : {
          icon: '/favicon.svg',
        },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <CartProvider>
          <Header user={user} />
          <main className="font-sans pt-16">{children}</main>
          <Footer />
          <CookieConsentBanner />
          <AdminLoginModal />
        </CartProvider>
      </body>
    </html>
  )
}
