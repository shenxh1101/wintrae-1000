import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, ClipboardCheck, Flame, Archive, Shield } from 'lucide-react'

const navItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/hazards', label: '隐患', icon: AlertTriangle },
  { path: '/inspections', label: '巡检', icon: ClipboardCheck },
  { path: '/drills', label: '演练', icon: Flame },
  { path: '/archives', label: '档案', icon: Archive },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fire-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide">消防管理系统</h1>
          <p className="text-[10px] text-slate-400">Fire Safety Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-fire-600 text-white shadow-lg shadow-fire-600/25'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fire-600 text-xs font-bold">
            赵
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">赵红</p>
            <p className="text-[10px] text-slate-400">物业主管</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
