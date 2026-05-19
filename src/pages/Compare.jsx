import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import indexData from '../data/concentrations/index.json'

const concentrationList = Object.values(indexData).sort((a, b) =>
  a.name.localeCompare(b.name)
)

function getCourseCodes(data) {
  const codes = new Set()
  for (const track of data.tracks ?? []) {
    for (const course of track.courses ?? []) {
      if (course.type === 'required') codes.add(course.course.code)
      if (course.type === 'choose_one') {
        course.options?.forEach(o => codes.add(o.code))
      }
    }
  }
  return codes
}

function getCourseMap(data) {
  const map = {}
  for (const track of data.tracks ?? []) {
    for (const course of track.courses ?? []) {
      if (course.type === 'required') {
        map[course.course.code] = course.course
      }
      if (course.type === 'choose_one') {
        course.options?.forEach(o => { map[o.code] = o })
      }
    }
  }
  return map
}

export default function Compare() {
  const navigate = useNavigate()
  const [slugA, setSlugA] = useState('comp')
  const [slugB, setSlugB] = useState('econ')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)

  useEffect(() => {
    setDataA(null)
    import('../data/concentrations/' + slugA + '.json')
      .then(m => setDataA(m.default))
  }, [slugA])

  useEffect(() => {
    setDataB(null)
    import('../data/concentrations/' + slugB + '.json')
      .then(m => setDataB(m.default))
  }, [slugB])

  const ready = dataA && dataB

  const codesA = ready ? getCourseCodes(dataA) : new Set()
  const codesB = ready ? getCourseCodes(dataB) : new Set()
  const mapA   = ready ? getCourseMap(dataA) : {}
  const mapB   = ready ? getCourseMap(dataB) : {}

  const shared  = [...codesA].filter(c => codesB.has(c))
  const onlyA   = [...codesA].filter(c => !codesB.has(c))
  const onlyB   = [...codesB].filter(c => !codesA.has(c))

  const overlapPct = ready && codesA.size > 0
    ? Math.round((shared.length / Math.max(codesA.size, codesB.size)) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Compare Concentrations
        </h1>
        <p className="text-sm text-gray-400">
          See shared requirements and unique courses between two concentrations.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">
            Concentration A
          </label>
          <select
            value={slugA}
            onChange={e => setSlugA(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
          >
            {concentrationList.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">
            Concentration B
          </label>
          <select
            value={slugB}
            onChange={e => setSlugB(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
          >
            {concentrationList.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!ready && (
        <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
      )}

      {ready && (
        <>
          {/* Overlap score */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Courses in A"
              value={codesA.size}
              sub={indexData[slugA]?.name}
            />
            <StatCard
              label="Overlap"
              value={overlapPct + '%'}
              sub={shared.length + ' shared courses'}
              highlight
            />
            <StatCard
              label="Courses in B"
              value={codesB.size}
              sub={indexData[slugB]?.name}
            />
          </div>

          {/* Overlap bar */}
          <div className="mb-8">
            <div className="flex text-xs text-gray-400 justify-between mb-1.5">
              <span>{indexData[slugA]?.name}</span>
              <span>{indexData[slugB]?.name}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-red-200 h-full"
                style={{ width: (onlyA.length / (codesA.size + codesB.size - shared.length)) * 100 + '%' }}
              />
              <div
                className="bg-purple-300 h-full"
                style={{ width: (shared.length / (codesA.size + codesB.size - shared.length)) * 100 + '%' }}
              />
              <div
                className="bg-blue-200 h-full"
                style={{ width: (onlyB.length / (codesA.size + codesB.size - shared.length)) * 100 + '%' }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-200 inline-block" />
                Only in A ({onlyA.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-300 inline-block" />
                Shared ({shared.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-200 inline-block" />
                Only in B ({onlyB.length})
              </span>
            </div>
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-3 gap-4">

            {/* Only in A */}
            <CourseColumn
              title={'Only in ' + indexData[slugA]?.name}
              courses={onlyA.map(c => mapA[c])}
              color="red"
              onView={() => navigate('/concentration/' + slugA)}
            />

            {/* Shared */}
            <CourseColumn
              title="Shared requirements"
              courses={shared.map(c => mapA[c] || mapB[c])}
              color="purple"
            />

            {/* Only in B */}
            <CourseColumn
              title={'Only in ' + indexData[slugB]?.name}
              courses={onlyB.map(c => mapB[c])}
              color="blue"
              onView={() => navigate('/concentration/' + slugB)}
            />

          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={
      'rounded-xl p-4 text-center border ' +
      (highlight
        ? 'bg-purple-50 border-purple-200'
        : 'bg-gray-50 border-gray-200')
    }>
      <div className={
        'text-2xl font-semibold mb-0.5 ' +
        (highlight ? 'text-purple-700' : 'text-gray-900')
      }>
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-300 mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

function CourseColumn({ title, courses, color, onView }) {
  const colors = {
    red:    'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
  }
  const headerColors = {
    red:    'text-red-700',
    purple: 'text-purple-700',
    blue:   'text-blue-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={
          'text-xs font-semibold uppercase tracking-wide ' + headerColors[color]
        }>
          {title}
        </h3>
        {onView && (
          <button
            onClick={onView}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            View
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
        {courses.length === 0 && (
          <p className="text-xs text-gray-300 italic">None</p>
        )}
        {courses.map((c, i) => c && (
          <div
            key={c.code + i}
            className={'text-xs px-2.5 py-1.5 rounded-lg border ' + colors[color]}
          >
            <span className="font-medium">{c.code}</span>
            {c.name && c.name !== c.code && (
              <span className="ml-1.5 opacity-70 font-normal">{c.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}