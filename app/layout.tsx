import './globals.css';
import AppHeader from '@/components/layout/AppHeader';
import AppSideNav from '@/components/layout/AppSideNav';
import { Providers } from './providers'; export default function RootLayout({ children }: { children: React.ReactNode }) { return ( <html lang="en" className="h-full"> <body className="min-h-screen bg-zinc-950 text-zinc-100"> <Providers> <div className="contents"> <AppHeader /> <div className="flex min-h-[calc(100vh-56px)]"> <AppSideNav /> <main className="flex-1"> <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div> </main> </div> </div> </Providers> </body> </html> ); }
