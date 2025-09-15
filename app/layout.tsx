import './globals.css'
import WalletContext from '@/components/Wallet/WalletContext'
import HeaderBar from '@/components/layout/Header'
import SideNav from '@/components/layout/SideNav'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletContext>
          <HeaderBar />
          <div className="flex">
            <SideNav />
            <main className="flex-1">{children}</main>
          </div>
        </WalletContext>
      </body>
    </html>
  )
}
