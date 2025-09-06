import './globals.css'
import { Providers } from './providers'
import { SideNav } from '@/components/layout/SideNav'
import { Topbar } from '@/components/layout/Topbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <div className="min-h-screen flex">
            {/* Sidebar - fixed width */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50 bg-card/50 backdrop-blur-sm border-r border-border">
              <SideNav className="flex-1" />
            </aside>

            {/* Main content area */}
            <div className="flex-1 md:ml-64">
              <Topbar />
              <main className="max-w-7xl mx-auto px-6 py-6 pb-16 space-y-6">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t border-border p-4">
            <div className="flex justify-around">
              {/* Mobile nav items will be added here */}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
