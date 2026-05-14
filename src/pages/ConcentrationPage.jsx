import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import index from '../data/concentrations/index.json'
import TrackCard from '../components/TrackCard'
import CourseSearch from '../components/CourseSearch'

export default function ConcentrationPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [degree, setDegree] = useState('ScB')
  const [completedCourses, setCompletedCourses] = useState([])
  const [scrapedData, setScrapedData] = useState(null)
  const [loading, setLoading] = useState(true)

  const meta = index[slug]

  useEffect(() => {
    setLoading(true)
    setScrapedData(null)
    setCompletedCourses([])
    import(`../data/concentrations/${slug}.json`)
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

  if (!meta) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400">
        Concentration not found.{' '}
        <button onClick={() => navigate('/')} className="text-red-700 underline">
          Go back
        </button>
      </div>
    )
  }

  const visibleTracks = scrapedData?.tracks.filter(track => {
    const name = track.name.toLowerCase()
    if (degree === 'AB') return !name.includes('sc.b') && !name.includes('scb') && !name.includes('sc b')
    if (degree === 'ScB') return !name.includes('a.b') && !name.includes(' ab ') && !name.includes('for the ab')
    return true
  }) ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Top nav */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← All concentrations
        </button>
        <span className="text-gray-200">/</span>
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
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  degree === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        
          href={`https://bulletin.brown.edu/the-college/concentrations/${slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-red-700 transition-colors"
        <a>
          View on Brown Bulletin ↗
        </a>

        {scrapedData && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span>{completedCourses.length} courses marked complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((completedCourses.length / (meta.total_courses || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
      )}

      {!loading && scrapedData && (
        <>
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
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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