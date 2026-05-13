import { useState } from 'react'

// Common CS courses students might search for
const COURSE_LIST = [
  { code: 'CSCI 0111', name: 'Computing Foundations: Data' },
  { code: 'CSCI 0150', name: 'Intro to OOP and Computer Science' },
  { code: 'CSCI 0170', name: 'CS: An Integrated Introduction' },
  { code: 'CSCI 0190', name: 'Accelerated Introduction to CS' },
  { code: 'CSCI 0200', name: 'Program Design with Data Structures' },
  { code: 'CSCI 0220', name: 'Intro to Discrete Structures and Probability' },
  { code: 'CSCI 0300', name: 'Fundamentals of Computer Systems' },
  { code: 'CSCI 0320', name: 'Introduction to Software Engineering' },
  { code: 'CSCI 0330', name: 'Introduction to Computer Systems' },
  { code: 'CSCI 0410', name: 'Foundations of AI and Machine Learning' },
  { code: 'CSCI 0500', name: 'Data Structures, Algorithms, and Intractability' },
  { code: 'CSCI 1300', name: 'User Interfaces and User Experience' },
  { code: 'CSCI 1310', name: 'Fundamentals of Computer Systems' },
  { code: 'CSCI 1380', name: 'Distributed Computer Systems' },
  { code: 'CSCI 1410', name: 'Artificial Intelligence' },
  { code: 'CSCI 1420', name: 'Machine Learning' },
  { code: 'CSCI 1430', name: 'Computer Vision' },
  { code: 'CSCI 1470', name: 'Deep Learning' },
  { code: 'CSCI 1515', name: 'Applied Cryptography' },
  { code: 'CSCI 1550', name: 'Probabilistic Methods in CS' },
  { code: 'CSCI 1660', name: 'Introduction to Computer Systems Security' },
  { code: 'CSCI 1670', name: 'Operating Systems' },
  { code: 'CSCI 1710', name: 'Logic for Systems' },
  { code: 'CSCI 1951A', name: 'Data Science' },
  { code: 'MATH 0100', name: 'Single Variable Calculus, Part II' },
  { code: 'MATH 0520', name: 'Linear Algebra' },
  { code: 'MATH 0540', name: 'Linear Algebra with Theory' },
  { code: 'MATH 1530', name: 'Abstract Algebra' },
  { code: 'APMA 1650', name: 'Statistical Inference I' },
  { code: 'APMA 1655', name: 'Honors Statistical Inference I' },
]

export default function CourseSearch({ onAdd, completedCourses }) {
  const [query, setQuery] = useState('')
  const completedCodes = completedCourses.map(c => c.code)

  const results = query.length > 1
    ? COURSE_LIST.filter(c =>
        (c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase())) &&
        !completedCodes.includes(c.code)
      ).slice(0, 5)
    : []

  return (
    <div className="relative mb-6">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a course to add (e.g. CSCI 0200)"
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
              <span className="text-xs text-red-600 opacity-0 group-hover:opacity-100">+ Add</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}