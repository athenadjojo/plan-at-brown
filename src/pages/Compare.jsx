import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import indexData from '../data/concentrations/index.json'

const concentrationModules = import.meta.glob('../data/concentrations/*.json')

const concentrationList = Object.values(indexData).sort((a, b) =>
  a.name.localeCompare(b.name)
)

function collectCoursesFromGroup(group, map) {
  for (const course of group.courses ?? []) {
    if (course?.code) {
      map[course.code] = course
    }
  }

  for (const subGroup of group.sub_groups ?? []) {
    collectCoursesFromGroup(subGroup, map)
  }
}

function getCourseMap(data) {
  const map = {}

  for (const track of data.tracks ?? []) {
    for (const group of track.groups ?? []) {
      collectCoursesFromGroup(group, map)
    }

    // Fallback for older data shape
    for (const item of track.courses ?? []) {
      if (item.type === 'required' && item.course?.code) {
        map[item.course.code] = item.course
      }

      if (item.type === 'choose_one') {
        item.options?.forEach(option => {
          if (option?.code) map[option.code] = option
        })
      }
    }
  }

  return map
}

function getCourseCodes(data) {
  return new Set(Object.keys(getCourseMap(data)))
}

export default function Compare() {
  const navigate = useNavigate()

  const [slugA, setSlugA] = useState('comp')
  const [slugB, setSlugB] = useState('econ')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)

  useEffect(() => {
    setDataA(null)

    const loader = concentrationModules[`../data/concentrations/${slugA}.json`]

    if (!loader) return

    loader()
      .then(m => setDataA(m.default))
      .catch(err => console.error('Failed to load concentration A:', err))
  }, [slugA])

  useEffect(() => {
    setDataB(null)

    const loader = concentrationModules[`../data/concentrations/${slugB}.json`]

    if (!loader) return

    loader()
      .then(m => setDataB(m.default))
      .catch(err => console.error('Failed to load concentration B:', err))
  }, [slugB])

  const ready = dataA && dataB

  const codesA = ready ? getCourseCodes(dataA) : new Set()
  const codesB = ready ? getCourseCodes(dataB) : new Set()
  const mapA = ready ? getCourseMap(dataA) : {}
  const mapB = ready ? getCourseMap(dataB) : {}

  const shared = [...codesA].filter(code => codesB.has(code))
  const onlyA = [...codesA].filter(code => !codesB.has(code))
  const onlyB = [...codesB].filter(code => !codesA.has(code))

  const unionSize = codesA.size + codesB.size - shared.length

  const overlapPct =
    ready && unionSize > 0 ? Math.round((shared.length / unionSize) * 100) : 0

  const onlyAPct = unionSize > 0 ? (onlyA.length / unionSize) * 100 : 0
  const sharedPct = unionSize > 0 ? (shared.length / unionSize) * 100 : 0
  const onlyBPct = unionSize > 0 ? (onlyB.length / unionSize) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Compare Concentrations
        </h1>
        <p className="text-sm text-gray-400">
          See shared requirements and unique courses between two concentrations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
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
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!ready && (
        <div className="text-center text-gray-400 py-12 text-sm">
          Loading...
        </div>
      )}

      {ready && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

          <div className="mb-8">
            <div className="flex text-xs text-gray-400 justify-between mb-1.5">
              <span>{indexData[slugA]?.name}</span>
              <span>{indexData[slugB]?.name}</span>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-red-200 h-full"
                style={{ width: onlyAPct + '%' }}
              />
              <div
                className="bg-purple-300 h-full"
                style={{ width: sharedPct + '%' }}
              />
              <div
                className="bg-blue-200 h-full"
                style={{ width: onlyBPct + '%' }}
              />
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CourseColumn
              title={'Only in ' + indexData[slugA]?.name}
              courses={onlyA.map(code => mapA[code]).filter(Boolean)}
              color="red"
              onView={() => navigate('/concentration/' + slugA)}
            />

            <CourseColumn
              title="Shared requirements"
              courses={shared.map(code => mapA[code] || mapB[code]).filter(Boolean)}
              color="purple"
            />

            <CourseColumn
              title={'Only in ' + indexData[slugB]?.name}
              courses={onlyB.map(code => mapB[code]).filter(Boolean)}
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
    <div
      className={
        'rounded-xl p-4 text-center border ' +
        (highlight
          ? 'bg-purple-50 border-purple-200'
          : 'bg-gray-50 border-gray-200')
      }
    >
      <div
        className={
          'text-2xl font-semibold mb-0.5 ' +
          (highlight ? 'text-purple-700' : 'text-gray-900')
        }
      >
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-300 mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

function CourseColumn({ title, courses, color, onView }) {
  const colors = {
    red: 'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  }

  const headerColors = {
    red: 'text-red-700',
    purple: 'text-purple-700',
    blue: 'text-blue-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3
          className={
            'text-xs font-semibold uppercase tracking-wide ' +
            headerColors[color]
          }
        >
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

        {courses.map((course, i) => (
          <div
            key={course.code + i}
            className={'text-xs px-2.5 py-1.5 rounded-lg border ' + colors[color]}
          >
            <span className="font-medium">{course.code}</span>
            {course.name && course.name !== course.code && (
              <span className="ml-1.5 opacity-70 font-normal">
                {course.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}