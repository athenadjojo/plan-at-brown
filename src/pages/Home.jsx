import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import index from '../data/concentrations/index.json'

const concentrationList = Object.values(index).sort((a, b) =>
  a.name.localeCompare(b.name)
)

const grouped = concentrationList.reduce((acc, c) => {
  const letter = c.name[0].toUpperCase()
  if (!acc[letter]) acc[letter] = []
  acc[letter].push(c)
  return acc
}, {})

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = query.length > 0
    ? concentrationList.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
          Plan<span className="text-red-700">@</span>Brown
        </h1>
        <p className="text-gray-500 text-sm">
          Track your concentration requirements. Powered by the Brown bulletin.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search concentrations..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
        />
      </div>

      {/* Search results */}
      {filtered && (
        <div className="flex flex-col">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 py-4">
              No concentrations found for "{query}"
            </p>
          )}
          {filtered.map(c => (
            <ConcentrationRow
              key={c.slug}
              c={c}
              onClick={() => navigate(`/concentration/${c.slug}`)}
            />
          ))}
        </div>
      )}

      {/* Full A-Z list */}
      {!filtered && (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([letter, concentrations]) => (
            <div key={letter}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100">
                {letter}
              </div>
              <div className="flex flex-col">
                {concentrations.map(c => (
                  <ConcentrationRow
                    key={c.slug}
                    c={c}
                    onClick={() => navigate(`/concentration/${c.slug}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConcentrationRow({ c, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-white hover:shadow-sm text-left transition-all group"
    >
      <span className="text-sm text-gray-800 group-hover:text-red-700 transition-colors">
        {c.name}
      </span>
      <span className="text-xs text-gray-300 group-hover:text-gray-400">
        {c.total_courses} courses →
      </span>
    </button>
  )
}