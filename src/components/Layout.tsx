import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileCheck,
  GitMerge,
  Calculator,
  ShieldCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

const navItems = [
  { label: '工作台', icon: LayoutDashboard, path: '/' },
  { label: '达人档案', icon: Users, path: '/kol' },
  { label: '探店排期', icon: Calendar, path: '/schedule' },
  { label: '线索核销', icon: FileCheck, path: '/verification' },
  { label: '成交匹配', icon: GitMerge, path: '/matching' },
  { label: '佣金试算', icon: Calculator, path: '/commission' },
  { label: '财务确认', icon: ShieldCheck, path: '/finance' },
  { label: '门店投产比', icon: BarChart3, path: '/roi' },
]

function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useAppStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-30',
        'bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)]'
      )}
      style={{ width: sidebarCollapsed ? 64 : 240 }}
    >
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--color-border)] shrink-0'
      )}>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm shrink-0">
          K
        </div>
        {!sidebarCollapsed && (
          <span className="ml-3 text-[var(--color-text-primary)] font-semibold text-sm whitespace-nowrap">
            KOL佣金结算
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => cn(
                  'flex items-center h-10 rounded-lg transition-colors relative group',
                  sidebarCollapsed ? 'justify-center px-0' : 'px-3',
                  isActive
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-accent)]" />
                    )}
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 text-sm">{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
              {sidebarCollapsed && (
                <div
                  className={cn(
                    'absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap z-50 pointer-events-none transition-opacity',
                    'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-lg',
                    hoveredItem === item.path ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {item.label}
                </div>
              )}
              {sidebarCollapsed && (
                <div
                  className="absolute inset-0"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn(
        'border-t border-[var(--color-border)] p-3 shrink-0'
      )}>
        <div className={cn(
          'flex items-center',
          sidebarCollapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-secondary)] text-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)] truncate">{currentUser.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{currentUser.role}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center',
          'bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]',
          'hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors z-40'
        )}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}

function TopBar() {
  const location = useLocation()
  const { currentUser } = useAppStore()

  const breadcrumbMap: Record<string, string> = {
    '/': '工作台',
    '/kol': '达人档案',
    '/schedule': '探店排期',
    '/verification': '线索核销',
    '/matching': '成交匹配',
    '/commission': '佣金试算',
    '/finance': '财务确认',
    '/roi': '门店投产比',
  }

  const currentLabel = breadcrumbMap[location.pathname] || '页面'

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--color-text-muted)]">首页</span>
        <span className="text-[var(--color-text-muted)]">/</span>
        <span className="text-[var(--color-text-primary)]">{currentLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-text-secondary)]">{currentUser.name}</span>
        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-secondary)] text-xs">
          {currentUser.name.charAt(0)}
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
