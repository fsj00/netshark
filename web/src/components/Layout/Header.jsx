import { Link, useLocation } from 'react-router-dom'
import { Shark, Home, BarChart3, Github, Settings } from 'lucide-react'

function Header() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/analysis', label: '分析', icon: BarChart3 },
  ]

  return (
    <header className="bg-dark-surface border-b border-dark-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-shark-500 to-shark-700 rounded-xl flex items-center justify-center group-hover:from-shark-400 group-hover:to-shark-600 transition-all">
              <Shark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NetShark</h1>
              <p className="text-xs text-dark-muted">网络数据包分析工具</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-shark-600/20 text-shark-400'
                      : 'text-dark-muted hover:text-dark-text hover:bg-dark-bg'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-bg rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <a
              href="https://github.com/netshark"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-gray-800 text-dark-text rounded-lg border border-dark-border transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
