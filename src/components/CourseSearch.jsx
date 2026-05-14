import { useState } from 'react'

export default function CourseSearch({ courses, onAdd, completedCourses }) {
  const [query, setQuery] = useState('')
  const completedCodes = completedCourses.map(c => c.code)

  const results = query.length > 1
    ? courses
        .filter(c =>
          (c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase())) &&
          !completedCodes.includes(c.code)
        )
        .slice(0, 6)
    : []

  return (
    <div className="relative mb-6">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a course to add..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
          {results.map(course => (
            <button
              key={course.code}
              onClick={() => { onAdd(course); setQuery('') }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group border-b border-gray-100 last:border-0"
            >
              <div>
                <span className="text-sm font-medium text-gray-900">{course.code}</span>
                <span className="text-xs text-gray-400 ml-2">{course.name}</span>
              </div>
              <span className="text-xs text-red-600 opacity-0 group-hover:opacity-100">
                + Add
              </span>
            </button>
          ))}
        </div>
      )}
      {query.length > 1 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-sm z-10 px-4 py-3">
          <p className="text-sm text-gray-400">No matching courses found</p>
        </div>
      )}
    </div>
  )
}