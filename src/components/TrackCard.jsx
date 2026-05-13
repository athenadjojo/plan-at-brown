export default function TrackCard({ track, degree, completedCourses, onAdd }) {
    const completedCodes = completedCourses.map(c => c.code)
  
    const isCompleted = (code) => completedCodes.includes(code)
  
    const getTrackStatus = () => {
      if (track.type === 'choose_one_series') {
        const matched = track.series.find(s =>
          s.courses.every(c => isCompleted(c))
        )
        return matched ? 'complete' : 'incomplete'
      }
  
      if (track.type === 'choose_one') {
        const matched = track.courses.find(c => isCompleted(c.code))
        return matched ? 'complete' : 'incomplete'
      }
  
      if (track.type === 'one_per_area') {
        const allDone = track.areas.every(area =>
          area.courses.some(c => isCompleted(c.code))
        )
        const someDone = track.areas.some(area =>
          area.courses.some(c => isCompleted(c.code))
        )
        return allDone ? 'complete' : someDone ? 'in-progress' : 'incomplete'
      }
  
      if (track.type === 'electives') {
        const req = track.degree_requirements[degree]
        const csci1000 = completedCourses.filter(c =>
          c.code.startsWith('CSCI') &&
          parseInt(c.code.replace('CSCI ', '')) >= 1000
        ).length
        if (csci1000 >= req.csci_1000_level) return 'complete'
        if (csci1000 > 0) return 'in-progress'
        return 'incomplete'
      }
  
      if (track.type === 'capstone') {
        return 'incomplete'
      }
  
      return 'incomplete'
    }
  
    const status = getTrackStatus()
  
    const statusStyles = {
      complete: {
        badge: 'bg-green-50 text-green-700 border border-green-200',
        label: 'Complete',
        border: 'border-green-200',
      },
      'in-progress': {
        badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        label: 'In progress',
        border: 'border-yellow-200',
      },
      incomplete: {
        badge: 'bg-gray-100 text-gray-500',
        label: 'Not started',
        border: 'border-gray-200',
      },
    }
  
    const style = statusStyles[status]
  
    return (
      <div className={`bg-white border rounded-xl p-5 ${style.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{track.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{track.description}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${style.badge}`}>
            {style.label}
          </span>
        </div>
  
        {/* Series type */}
        {track.type === 'choose_one_series' && (
          <div className="flex flex-col gap-2">
            {track.series.map(s => (
              <div key={s.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 w-16">{s.name}</span>
                {s.courses.map(code => (
                  <CoursePill
                    key={code}
                    code={code}
                    done={isCompleted(code)}
                    onAdd={() => onAdd({ code, name: code })}
                  />
                ))}
                {s.note && <span className="text-xs text-gray-400 italic">{s.note}</span>}
              </div>
            ))}
          </div>
        )}
  
        {/* Choose one type */}
        {track.type === 'choose_one' && (
          <div className="flex flex-wrap gap-2">
            {track.courses.map(c => (
              <CoursePill
                key={c.code}
                code={c.code}
                name={c.name}
                done={isCompleted(c.code)}
                onAdd={() => onAdd({ code: c.code, name: c.name })}
              />
            ))}
          </div>
        )}
  
        {/* One per area type */}
        {track.type === 'one_per_area' && (
          <div className="flex flex-col gap-3">
            {track.areas.map(area => (
              <div key={area.id}>
                <p className="text-xs text-gray-400 mb-1.5">{area.name}</p>
                <div className="flex flex-wrap gap-2">
                  {area.courses.map(c => (
                    <CoursePill
                      key={c.code}
                      code={c.code}
                      name={c.name}
                      done={isCompleted(c.code)}
                      onAdd={() => onAdd({ code: c.code, name: c.name })}
                    />
                  ))}
                </div>
                {area.note && <p className="text-xs text-gray-400 mt-1 italic">{area.note}</p>}
              </div>
            ))}
          </div>
        )}
  
        {/* Electives type */}
        {track.type === 'electives' && (
          <div>
            <p className="text-xs text-gray-500">
              {degree === 'ScB'
                ? '5 CSCI 1000-level + 4 additional electives'
                : '2 CSCI 1000-level + 2 additional electives'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {completedCourses
                .filter(c => c.code.startsWith('CSCI') && parseInt(c.code.replace('CSCI ', '')) >= 1000)
                .map(c => (
                  <CoursePill key={c.code} code={c.code} done={true} />
                ))}
            </div>
            {track.approved_outside_courses && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1.5">Approved outside courses</p>
                <div className="flex flex-wrap gap-2">
                  {track.approved_outside_courses.map(c => (
                    <CoursePill
                      key={c.code}
                      code={c.code}
                      name={c.name}
                      done={isCompleted(c.code)}
                      onAdd={() => onAdd({ code: c.code, name: c.name })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Capstone */}
        {track.type === 'capstone' && (
          <p className="text-xs text-gray-400">
            See the CS concentration handbook for approved capstone courses.
          </p>
        )}
      </div>
    )
  }
  
  function CoursePill({ code, name, done, onAdd }) {
    return (
      <button
        onClick={!done ? onAdd : undefined}
        title={name}
        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
          done
            ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-700 hover:bg-red-50 cursor-pointer'
        }`}
      >
        {done && <span className="mr-1">✓</span>}
        {code}
      </button>
    )
  }