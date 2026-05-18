import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import index from '../data/concentrations/index.json'
import csData from '../data/cs_concentration.json'
import TrackCard from '../components/TrackCard'
import CourseSearch from '../components/CourseSearch'

const STRUCTURED = {
  comp: csData,
}

export default function ConcentrationPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [degree, setDegree] = useState('ScB')
  const [completedCourses, setCompletedCourses] = useState([])
  const [scrapedData, setScrapedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTrackIndex, setActiveTrackIndex] = useState(0)
  const trackRefs = useRef([])

  const meta = index[slug]
  const isStructured = !!STRUCTURED[slug]
  const structuredData = STRUCTURED[slug]

  useEffect(() => {
    setLoading(true)
    setScrapedData(null)
    setCompletedCourses([])
    setActiveTrackIndex(0)
    trackRefs.current = []
    import('../data/concentrations/' + slug + '.json')
      .then(mod => {
        setScrapedData(mod.default)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  // Scroll spy — update active sidebar item based on scroll position
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

  const scrollToTrack = (index) => {
    const el = trackRefs.current[index]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 76
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const addCourse = (course) => {
    if (!completedCourses.find(c => c.code === course.code)) {
      setCompletedCourses(prev => [...prev, course])
    }
  }

  const removeCourse = (code) => {
    setCompletedCourses(prev => prev.filter(c => c.code !== code))
  }

  const visibleTracks = isStructured
    ? structuredData.tracks
    : (scrapedData?.tracks ?? []).filter(track => {
        const name = track.name.toLowerCase()
        if (degree === 'AB') {
          return !name.includes('sc.b') && !name.includes('scb') && !name.includes('sc b')
        }
        if (degree === 'ScB') {
          return !name.includes('a.b') && !name.includes(' ab ') && !name.includes('for the ab')
        }
        return true
      })

  const totalRequired = isStructured
    ? (structuredData.total_credits?.[degree] ?? 0)
    : 0

  const progressPct = totalRequired > 0
    ? Math.min((completedCourses.length / totalRequired) * 100, 100)
    : 0

  const hasNoTracks = !loading && scrapedData && visibleTracks.length === 0
  const hasProsDescription = !loading && scrapedData && scrapedData.description
  const showSidebar = !loading && visibleTracks.length > 0

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

      {/* Breadcrumb */}
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">{meta.name}</h1>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['ScB', 'AB'].map(d => (
              <button
                key={d}
                onClick={() => setDegree(d)}
                className={
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ' +
                  (degree === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700')
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <a
          href={'https://bulletin.brown.edu/the-college/concentrations/' + slug + '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-red-700 transition-colors"
        >
          View on Brown Bulletin
        </a>

        {isStructured && totalRequired > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>{totalRequired} courses required</span>
              <span>{completedCourses.length} / {totalRequired} complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-700 h-2 rounded-full transition-all duration-500"
                style={{ width: progressPct + '%' }}
              />
            </div>
          </div>
        )}

        {!isStructured && completedCourses.length > 0 && (
          <div className="mt-3 text-sm text-gray-500">
            {completedCourses.length} course{completedCourses.length !== 1 ? 's' : ''} marked complete
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
      )}

      {/* Prose-only concentration */}
      {hasNoTracks && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          {hasProsDescription && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {scrapedData.description}
            </p>
          )}
          <p className="text-xs text-gray-400 mb-3">
            This concentration's requirements are described in prose and could not be
            automatically structured into a checklist.
          </p>
          <a
            href={'https://bulletin.brown.edu/the-college/concentrations/' + slug + '/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-700 font-medium hover:underline"
          >
            View full requirements on Brown Bulletin
          </a>
        </div>
      )}

      {/* Two-column layout: sidebar + tracks */}
      {!loading && scrapedData && !hasNoTracks && (
        <>
          {/* Course search + completed pills — full width above columns */}
          <CourseSearch
            courses={scrapedData.all_courses}
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
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar + track cards */}
          <div className="flex gap-6 items-start">

            {/* Left section sidebar */}
            {showSidebar && (
              <aside className="w-44 shrink-0 hidden lg:block">
                <div className="sticky top-20">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    Sections
                  </p>
                  <nav className="space-y-0.5">
                    {visibleTracks.map((track, i) => (
                      <button
                        key={i}
                        onClick={() => scrollToTrack(i)}
                        className={
                          'w-full text-left px-2 py-1.5 rounded-lg text-xs leading-snug transition-all duration-150 ' +
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

            {/* Track cards */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {visibleTracks.map((track, i) => (
                <div
                  key={track.id || i}
                  ref={el => { trackRefs.current[i] = el }}
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
    </div>
  )
}
