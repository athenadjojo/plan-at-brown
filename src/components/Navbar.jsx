import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Concentration', path: '/', match: (p) => p === '/' || p.startsWith('/concentration') },
  { label: 'Analytics', path: '/analytics', match: (p) => p.startsWith('/analytics') },
  { label: 'Compare', path: '/compare', match: (p) => p.startsWith('/compare') },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-6 h-14">
        <button
          onClick={() => navigate('/')}
          className="text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors shrink-0"
        >
          Plan<span className="text-red-700">@</span>Brown
        </button>
        <div className="flex items-center gap-1">
          {tabs.map(tab => {
            const active = tab.match(pathname)
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium pressable ' +
                  (active
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100')
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
