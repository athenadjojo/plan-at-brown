import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import index from '../data/concentrations/index.json'
import TrackCard from '../components/TrackCard'
import CourseSearch from '../components/CourseSearch'

const concentrationModules = import.meta.glob('../data/concentrations/*.json')

function countGroupSlots(group) {
  if (group.type === 'section') {
    const sub = (group.sub_groups ?? []).reduce((n, g) => n + countGroupSlots(g), 0)
    return group.count ?? sub
  }
  if (group.type === 'required') return (group.courses ?? []).length > 0 ? 1 : 0
  if (group.type === 'choose_one') return 1
  return 0
}

function countGroupCompleted(group, codes) {
  if (group.type === 'section') {
    const sub = (group.sub_groups ?? []).reduce((n, g) => n + countGroupCompleted(g, codes), 0)
    const req = group.count ?? (group.sub_groups ?? []).reduce((n, g) => n + countGroupSlots(g), 0)
    return Math.min(sub, req)
  }

  if (group.type === 'required') {
    return (group.courses ?? []).some(c => codes.includes(c.code)) ? 1 : 0
  }

  if (group.type === 'choose_one') {
    return (group.courses ?? []).some(c => codes.includes(c.code)) ? 1 : 0
  }

  return 0
}

export default function ConcentrationPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [degree, setDegree] = useState('ScB')
  const [completedCourses, setCompletedCourses] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTrackIndex, setActiveTrackIndex] = useState(0)
  const [selectedTrackId, setSelectedTrackId] = useState(null)

  const trackRefs = useRef([])
  const meta = index[slug]

  useEffect(() => {
    setLoading(true)
    setData(null)
    setCompletedCourses([])
    setActiveTrackIndex(0)
    setSelectedTrackId(null)
    trackRefs.current = []

    const loader = concentrationModules[`../data/concentrations/${slug}.json`]

    if (!loader) {
      setLoading(false)
      return
    }

    loader()
      .then(mod => {
        setData(mod.default)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load concentration:', err)
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    const handleScroll = () => {
      let active = 0
      trackRefs.current.forEach((el, i) => {
        if (el) {
          const top = el.getBoundingClientRect().top
          if (top <= 100) active = i
        }
      })
      setActiveTrackIndex(active)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTrack = index => {
    const el = trackRefs.current[index]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 76
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const addCourse = course => {
    if (!completedCourses.find(c => c.code === course.code)) {
      setCompletedCourses(prev => [...prev, course])
    }
  }

  const removeCourse = code => {
    setCompletedCourses(prev => prev.filter(c => c.code !== code))
  }

  const availableDegrees = data?.degrees ?? ['ScB', 'AB']
  const requiresTrackSelection = !!data?.requires_track_selection

  const visibleTracks = (data?.tracks ?? []).filter(track => {
    const name = track.name?.toLowerCase() ?? ''

    if (degree === 'AB') {
      return !name.includes('sc.b') && !name.includes('scb') && !name.includes('sc b')
    }

    if (degree === 'ScB') {
      return !name.includes('a.b') && !name.includes(' ab ') && !name.includes('for the ab')
    }

    return true
  })

  const displayTracks =
    requiresTrackSelection && selectedTrackId
      ? visibleTracks.filter(t => t.id === selectedTrackId)
      : requiresTrackSelection
        ? []
        : visibleTracks

  const selectedTrack =
    requiresTrackSelection && selectedTrackId
      ? visibleTracks.find(t => t.id === selectedTrackId)
      : null

  const completedCodes = completedCourses.map(c => c.code)

  const progress = displayTracks.reduce(
    (acc, track) => {
      const groups = track.groups ?? []
      const total = groups.reduce((n, g) => n + countGroupSlots(g), 0)
      const done = groups.reduce((n, g) => n + countGroupCompleted(g, completedCodes), 0)
      return {
        total: acc.total + total,
        done: acc.done + done,
      }
    },
    { total: 0, done: 0 }
  )

  const totalRequired =
    selectedTrack?.total_credits ??
    data?.total_credits?.[degree] ??
    progress.total ??
    0

  const progressDone = progress.done || completedCourses.length

  const progressPct =
    totalRequired > 0 ? Math.min((progressDone / totalRequired) * 100, 100) : 0

  const hasNoTracks = !loading && data && visibleTracks.length === 0
  const showSidebar = !loading && displayTracks.length > 0

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400">
        Concentration not found.{' '}
        <button
          onClick={() => navigate('/')}
          className="text-red-700 underline"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in">
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          All concentrations
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">{meta.name}</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">{meta.name}</h1>

          {availableDegrees.length > 1 && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {availableDegrees.map(d => (
                <button
                  key={d}
                  onClick={() => setDegree(d)}
                  className={
                    'px-4 py-1.5 rounded-md text-sm font-medium pressable ' +
                    (degree === d
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700')
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <a
          href={data?.url ?? `https://bulletin.brown.edu/the-college/concentrations/${slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-red-700 transition-colors"
        >
          View on Brown Bulletin
        </a>

        {totalRequired > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>{totalRequired} courses required</span>
              <span>
                {progressDone} / {totalRequired} complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-700 h-2 rounded-full"
                style={{
                  width: progressPct + '%',
                  transition: 'width 500ms cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              />
            </div>
          </div>
        )}

        {requiresTrackSelection && !selectedTrackId && !loading && (
          <p className="mt-4 text-sm text-gray-400">
            Select a track below to see requirements and track progress.
          </p>
        )}
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-12 text-sm">
          Loading...
        </div>
      )}

      {hasNoTracks && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          {data?.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {data.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mb-3">
            This concentration's requirements are described in prose and could not be
            automatically structured into a checklist.
          </p>
          <a
            href={data?.url ?? `https://bulletin.brown.edu/the-college/concentrations/${slug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-700 font-medium hover:underline"
          >
            View full requirements on Brown Bulletin
          </a>
        </div>
      )}

      {!loading && data && !hasNoTracks && (
        <>
          {requiresTrackSelection && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Select your track
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleTracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={
                      'px-4 py-2 rounded-lg text-sm font-medium pressable border ' +
                      (selectedTrackId === track.id
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-700')
                    }
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!requiresTrackSelection || selectedTrackId) && (
            <>
              <CourseSearch
                courses={data.all_courses ?? []}
                onAdd={addCourse}
                completedCourses={completedCourses}
              />

              {completedCourses.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Courses you've taken
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {completedCourses.map(c => (
                      <span
                        key={c.code}
                        className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 text-xs px-3 py-1.5 rounded-full"
                      >
                        {c.code}
                        <button
                          onClick={() => removeCourse(c.code)}
                          className="hover:text-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-6 items-start">
                {showSidebar && (
                  <aside className="w-44 shrink-0 hidden lg:block">
                    <div className="sticky top-20">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        Sections
                      </p>
                      <nav className="space-y-0.5">
                        {displayTracks.map((track, i) => (
                          <button
                            key={track.id || i}
                            onClick={() => scrollToTrack(i)}
                            className={
                              'w-full text-left px-2 py-1.5 rounded-lg text-xs leading-snug pressable ' +
                              (activeTrackIndex === i
                                ? 'bg-red-50 text-red-700 font-medium'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100')
                            }
                          >
                            <span className="line-clamp-2">{track.name}</span>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </aside>
                )}

                <div className="flex-1 min-w-0 flex flex-col gap-4">
                  {displayTracks.map((track, i) => (
                    <div
                      key={track.id || i}
                      ref={el => {
                        trackRefs.current[i] = el
                      }}
                      className="animate-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <TrackCard
                        track={track}
                        degree={degree}
                        completedCourses={completedCourses}
                        onAdd={addCourse}
                        onRemove={removeCourse}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}