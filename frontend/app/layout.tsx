import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import SettingsMenu from '../components/SettingsMenu';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Persona Twin',
  description: 'Chat with a digital version of a person',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white min-h-screen flex transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 flex flex-col hidden md:flex transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 bg-clip-text text-transparent">
              Persona Twin
            </h1>
          </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link href="/" className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Dashboard
              </Link>
              <Link href="/personas" className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Personas
              </Link>
              <Link href="/chat" className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Chat
              </Link>
              <Link href="/knowledge" className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Knowledge
              </Link>
            </nav>
            <SettingsMenu />
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
