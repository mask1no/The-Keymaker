import './ globals.css'
import WalletContext from '@/ components / Wallet / WalletContext'
import HeaderBar from '@/ components / layout / Header'
import SideNav from '@/ components / layout / SideNav' export default function R o o tLayout({ children }: { c, h, i, l, d, r, e, n: React.ReactNode
}) { r eturn ( < html lang ="en"> < body > < WalletContext > < HeaderBar /> < div class
  Name ="flex"> < S ideNav /> < main class
  Name ="flex - 1">{children}</ main > </ div > </ WalletContext > </ body > </ html > ) }
