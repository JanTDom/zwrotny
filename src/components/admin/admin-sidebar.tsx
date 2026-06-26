'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Sparkles,
  Palette,
  Layers,
  Image,
  Megaphone,
  Search,
  Key,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Youtube,
  BookOpen,
  HelpCircle,
  Gift,
  Film,
  Radio,
  Facebook,
  Mail,
  BarChart3,
  Library,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string | number
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const menuItems: NavGroup[] = [
  {
    title: 'Panel główny',
    items: [
      { label: 'Dashboard', href: '/zk7m9', icon: LayoutDashboard },
      { label: 'Statystyki', href: '/zk7m9/statystyki', icon: BarChart3 },
      { label: 'Inbox AI', href: '/zk7m9/inbox', icon: Inbox },
    ],
  },
  {
    title: 'Treści',
    items: [
      { label: 'Artykuły', href: '/zk7m9/artykuly', icon: FileText },
      { label: 'Poradniki', href: '/zk7m9/poradniki', icon: BookOpen },
      { label: 'Mity vs Fakty', href: '/zk7m9/mity', icon: HelpCircle },
      { label: 'YouTube', href: '/zk7m9/youtube', icon: Youtube },
      { label: 'Filmy MP4', href: '/zk7m9/filmy', icon: Film },
      { label: 'Bonusy PDF', href: '/zk7m9/bonusy', icon: Gift },
      { label: 'Biblioteka dokumentów', href: '/zk7m9/dokumenty', icon: Library },
      { label: 'Pliki do pobrania', href: '/zk7m9/pliki-do-pobrania', icon: Download },
      { label: 'Prompty AI', href: '/zk7m9/prompty', icon: Sparkles },
    ],
  },
  {
    title: 'Wygląd',
    items: [
      { label: 'Ustawienia stylu', href: '/zk7m9/styl', icon: Palette },
      { label: 'Sekcje', href: '/zk7m9/sekcje', icon: Layers },
      { label: 'Banery i infografiki', href: '/zk7m9/banery', icon: Image },
      { label: 'Radar branżowy', href: '/zk7m9/ticker', icon: Radio },
      { label: 'Reklamy', href: '/zk7m9/reklamy', icon: Megaphone },
    ],
  },
  {
    title: 'Ustawienia',
    items: [
      { label: 'SEO', href: '/zk7m9/seo', icon: Search },
      { label: 'Newsletter', href: '/zk7m9/newsletter', icon: Mail },
      { label: 'Facebook', href: '/zk7m9/facebook', icon: Facebook },
      { label: 'API', href: '/zk7m9/api', icon: Key },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link href="/zk7m9" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">Z</span>
              </div>
              <div>
                <span className="font-bold text-sm">ZWROTNY</span>
                <span className="text-xs text-sidebar-foreground/60 block">Admin Panel</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/"
            target="_blank"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <ExternalLink className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Zobacz stronę</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
