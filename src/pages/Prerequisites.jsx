import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import prereqData from '../data/prerequisites.json'

const ALL_COURSES = Object.keys(prereqData).sort()

function buildChain(code, visited = new Set(), depth = 0) {
  if (depth > 4 || visited.has(code)) return null
  visited.add(code)
  const prereqs = prereqData[code] ?? []
  return {
    code,
    prereqs: prereqs
      .map(p => buildChain(p, new Set(visited), depth + 1))
      .filter(Boolean)
  }
}

function getUnlocks(code) {
  return Object.entries(prereqData)
    .filter(([, prereqs]) => prereqs.includes(code))
    .map(([c]) => c)
}

export default function Prerequisites() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const results = query.length > 1
    ? ALL_COURSES.filter(c =>
        c.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  const chain = useMemo(() =>
    selected ? buildChain(selected) : null,
    [selected]
  )

  const unlocks = useMemo(() =>
    selected ? getUnlocks(selected) : [],
    [selected]
  )

  const prereqs = selected ? (prereqData[selected] ?? []) : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Home
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Prerequisites</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Prerequisite Explorer
        </h1>
        <p className="text-sm text-gray-400">
          Search any course to see what it requires and what it unlocks.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search a course e.g. CSCI 1670, ECON 1110..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
        />
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {results.map(code => (
              <button
                key={code}
                onClick={() => { setSelected(code); setQuery('') }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800 border-b border-gray-100 last:border-0"
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected course view */}
      {selected && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">{selected}</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-medium text-gray-900 mb-0.5">
                {prereqs.length}
              </div>
              <div className="text-xs text-gray-400">Prerequisites</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-medium text-gray-900 mb-0.5">
                {unlocks.length}
              </div>
              <div className="text-xs text-gray-400">Courses unlocked</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Prereq chain */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                Requires
              </p>
              {prereqs.length === 0 ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-700 font-medium">
                    No prerequisites
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Open to all students
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <FullChain node={chain} />
                </div>
              )}
            </div>

            {/* Unlocks */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                Unlocks
              </p>
              {unlocks.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 italic">
                    No downstream courses found
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                  {unlocks.map(code => (
                    <button
                      key={code}
                      onClick={() => setSelected(code)}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 border border-green-100 rounded-lg hover:border-green-300 transition-all text-left"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-green-700">{code}</span>
                      <span className="text-xs text-green-500 ml-auto">explore →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selected && (
        <div className="text-center py-16">
          <p className="text-gray-300 text-sm">Search a course above to explore its prereq chain</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['CSCI 1670', 'CSCI 0300', 'ECON 1110', 'MATH 0520', 'PHYS 0500'].map(code => (
              <button
                key={code}
                onClick={() => setSelected(code)}
                className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:border-red-300 hover:text-red-700 transition-all"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FullChain({ node, depth = 0 }) {
  if (!node) return null
  const { code, prereqs } = node
  return (
    <div className={depth > 0 ? 'ml-3 pl-2 border-l border-gray-100' : ''}>
      {depth > 0 && (
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700">{code}</span>
        </div>
      )}
      {prereqs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {prereqs.map((child, i) => (
            <FullChain key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}