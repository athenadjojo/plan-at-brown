import { useState, useEffect } from 'react'
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

  const meta = index[slug]
  const isStructured = !!STRUCTURED[slug]
  const structuredData = STRUCTURED[slug]

  useEffect(() => {
    setLoading(true)
    setScrapedData(null)
    setCompletedCourses([])
    import('../data/concentrations/' + slug + '.json')
      .then(mod => {
        setScrapedData(mod.default)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const addCourse = (course) => {
    if (!completedCourses.find(c => c.code === course.code)) {
      setCompletedCourses(prev => [...prev, course])
    }
  }

  const removeCourse = (code) => {
    setCompletedCourses(prev => prev.filter(c => c.code !== code))
  }

  // Filter tracks by degree toggle
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
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Top nav */}
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
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all ' +
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

        {/* Bulletin link — no template literals, no special arrow chars */}
        <a
          href={'https://bulletin.brown.edu/the-college/concentrations/' + slug + '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-red-700 transition-colors"
        >
          View on Brown Bulletin
        </a>

        {/* Progress bar — structured concentrations only */}
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

        {/* Scraped progress — just a count */}
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

      {/* No tracks — prose-only concentration (e.g. Africana, American Studies) */}
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

      {/* Main content */}
      {!loading && scrapedData && !hasNoTracks && (
        <>
          {/* Course search */}
          <CourseSearch
            courses={scrapedData.all_courses}
            onAdd={addCourse}
            completedCourses={completedCourses}
          />

          {/* Completed pills */}
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

          {/* Tracks */}
          <div className="flex flex-col gap-4">
            {visibleTracks.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                degree={degree}
                completedCourses={completedCourses}
                onAdd={addCourse}
                onRemove={removeCourse}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}