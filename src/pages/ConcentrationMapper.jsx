import { useState } from 'react'
import csData from '../data/cs_concentration.json'
import TrackCard from '../components/TrackCard'
import CourseSearch from '../components/CourseSearch'

export default function ConcentrationMapper() {
  const [degree, setDegree] = useState('ScB')
  const [completedCourses, setCompletedCourses] = useState([])

  const addCourse = (course) => {
    if (!completedCourses.find(c => c.code === course.code)) {
      setCompletedCourses([...completedCourses, course])
    }
  }

  const removeCourse = (code) => {
    setCompletedCourses(completedCourses.filter(c => c.code !== code))
  }

  // Calculate overall progress
  const totalRequired = csData.total_credits[degree]
  const completedCount = completedCourses.length
  const progressPct = Math.min((completedCount / totalRequired) * 100, 100)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Plan<span className="text-red-700">@</span>Brown
          </h1>
          {/* Degree toggle */}
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
        <p className="text-gray-500 text-sm">CS Concentration · {totalRequired} courses required</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1.5">
            <span>Overall progress</span>
            <span>{completedCount} / {totalRequired} courses</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-700 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course search */}
      <CourseSearch onAdd={addCourse} completedCourses={completedCourses} />

      {/* Completed courses pills */}
      {completedCourses.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Courses you've taken</p>
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

      {/* Requirement tracks */}
      <div className="flex flex-col gap-4">
        {csData.tracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            degree={degree}
            completedCourses={completedCourses}
            onAdd={addCourse}
          />
        ))}
      </div>

    </div>
  )
}