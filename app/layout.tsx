import './globals.css'
import WalletContext from '@/components/Wallet/WalletContext'
import HeaderBar from '@/components/layout/Header'
import SideNav from '@/components/layout/SideNav'

export default function R o otLayout({  children }: { c, h, i, l, d, r, e, n: React.ReactNode
}) {
    return ( <html lang ="en"> <body> <WalletContext> <HeaderBar/> <div className ="flex"> <S ideNav/> <main className ="flex-1">{children}</main> </div> </WalletContext> </body> </html> )
  }
