export default function TrackCard({ track, degree, completedCourses, onAdd, onRemove }) {
    const completedCodes = completedCourses.map(c => c.code)
    const isCompleted = (code) => completedCodes.includes(code)
  
    // Determine if this is the old CS structured format
    const isStructured = ['choose_one_series','choose_one','one_per_area','electives','capstone']
      .includes(track.type)
  
    // ── STATUS ────────────────────────────────────────────────────
    const getStatus = () => {
      if (track.type === 'choose_one_series') {
        return track.series?.find(s => s.courses.every(c => isCompleted(c)))
          ? 'complete' : 'incomplete'
      }
      if (track.type === 'choose_one') {
        return track.courses?.find(c => isCompleted(c.code)) ? 'complete' : 'incomplete'
      }
      if (track.type === 'one_per_area') {
        const all  = track.areas?.every(a => a.courses.some(c => isCompleted(c.code)))
        const some = track.areas?.some(a => a.courses.some(c => isCompleted(c.code)))
        return all ? 'complete' : some ? 'in-progress' : 'incomplete'
      }
      if (track.type === 'electives') {
        const req = track.degree_requirements?.[degree]
        if (!req) return 'incomplete'
        const n = completedCourses.filter(c =>
          c.code.startsWith('CSCI') && parseInt(c.code.replace('CSCI ', '')) >= 1000
        ).length
        return n >= req.csci_1000_level ? 'complete' : n > 0 ? 'in-progress' : 'incomplete'
      }
      if (track.type === 'capstone') return 'incomplete'
  
      // Scraped format — count from flat courses list
      const flat = track.courses ?? []
      const total = flat.length
      if (total === 0) return 'info'
      const done = flat.filter(c =>
        c.type === 'required'
          ? isCompleted(c.course.code)
          : c.options?.some(o => isCompleted(o.code))
      ).length
      return done === total ? 'complete' : done > 0 ? 'in-progress' : 'incomplete'
    }
  
    const status = getStatus()
    const statusStyles = {
      complete:      { badge: 'bg-green-50 text-green-700 border border-green-200',    label: 'Complete',    border: 'border-green-200'  },
      'in-progress': { badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'In progress', border: 'border-yellow-200' },
      incomplete:    { badge: 'bg-gray-100 text-gray-500',                             label: 'Not started', border: 'border-gray-200'   },
      info:          { badge: 'bg-blue-50 text-blue-600',                              label: 'Info',        border: 'border-gray-200'   },
    }
    const style = statusStyles[status] ?? statusStyles.incomplete
  
    // Progress subtitle for scraped tracks
    const flat = track.courses ?? []
    const flatDone = flat.filter(c =>
      c.type === 'required'
        ? isCompleted(c.course.code)
        : c.options?.some(o => isCompleted(o.code))
    ).length
  
    return (
      <div className={`bg-white border rounded-xl p-5 ${style.border}`}>
  
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{track.name}</h3>
            {track.description && (
              <p className="text-xs text-gray-400 mt-0.5">{track.description}</p>
            )}
            {!isStructured && flat.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{flatDone} of {flat.length} complete</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ml-4 ${style.badge}`}>
            {style.label}
          </span>
        </div>
  
        {/* ── STRUCTURED FORMAT (CS) ── */}
        {track.type === 'choose_one_series' && (
          <div className="flex flex-col gap-3">
            {track.series?.map(s => (
              <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">{s.name}</p>
                <div className="flex flex-wrap gap-2">
                  {s.courses.map(code => (
                    <Pill key={code} code={code} done={isCompleted(code)}
                      onAdd={() => onAdd({ code, name: code })}
                      onRemove={() => onRemove(code)} />
                  ))}
                </div>
                {s.note && <p className="text-xs text-gray-400 mt-2 italic">{s.note}</p>}
              </div>
            ))}
          </div>
        )}
  
        {track.type === 'choose_one' && (
          <div className="flex flex-wrap gap-2">
            {track.courses?.map(c => (
              <Pill key={c.code} code={c.code} name={c.name} done={isCompleted(c.code)}
                onAdd={() => onAdd({ code: c.code, name: c.name })}
                onRemove={() => onRemove(c.code)} />
            ))}
          </div>
        )}
  
        {track.type === 'one_per_area' && (
          <div className="flex flex-col gap-3">
            {track.areas?.map(area => (
              <div key={area.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">{area.name}</p>
                <div className="flex flex-wrap gap-2">
                  {area.courses.map(c => (
                    <Pill key={c.code} code={c.code} name={c.name} done={isCompleted(c.code)}
                      onAdd={() => onAdd({ code: c.code, name: c.name })}
                      onRemove={() => onRemove(c.code)} />
                  ))}
                </div>
                {area.note && <p className="text-xs text-gray-400 mt-1 italic">{area.note}</p>}
              </div>
            ))}
          </div>
        )}
  
        {track.type === 'electives' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              {degree === 'ScB'
                ? '5 CSCI 1000-level + 4 additional electives'
                : '2 CSCI 1000-level + 2 additional electives'}
            </p>
            <div className="flex flex-wrap gap-2">
              {completedCourses
                .filter(c => c.code.startsWith('CSCI') && parseInt(c.code.replace('CSCI ', '')) >= 1000)
                .map(c => <Pill key={c.code} code={c.code} done onRemove={() => onRemove(c.code)} />)}
            </div>
            {track.approved_outside_courses && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">Approved outside courses</p>
                <div className="flex flex-wrap gap-2">
                  {track.approved_outside_courses.map(c => (
                    <Pill key={c.code} code={c.code} name={c.name} done={isCompleted(c.code)}
                      onAdd={() => onAdd({ code: c.code, name: c.name })}
                      onRemove={() => onRemove(c.code)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
  
        {track.type === 'capstone' && (
          <p className="text-xs text-gray-400">
            See the concentration handbook for approved capstone courses.
          </p>
        )}
  
        {/* ── SCRAPED FORMAT (all other concentrations) ── */}
        {!isStructured && (
          <div className="flex flex-col gap-3">
            {(track.groups ?? []).map((group, i) => (
              <SectionBlock
                key={i}
                group={group}
                isCompleted={isCompleted}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            ))}
  
            {track.notes?.length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-1">
                {track.notes.map((note, i) => (
                  <p key={i} className="text-xs text-gray-400 italic leading-relaxed">{note}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // ── SCRAPED SECTION RENDERER ──────────────────────────────────────
  
  function SectionBlock({ group, isCompleted, onAdd, onRemove }) {
    if (!group) return null
  
    if (group.type === 'section') {
      // Calculate completion for this section
      const allCourses = getAllCoursesInGroup(group)
      const requiredCount = group.count ?? null
      const completedCount = allCourses.filter(c => isCompleted(c.code)).length
  
      let sectionStatus = 'incomplete'
      if (requiredCount !== null) {
        if (completedCount >= requiredCount) sectionStatus = 'complete'
        else if (completedCount > 0) sectionStatus = 'in-progress'
      } else {
        if (completedCount === allCourses.length && allCourses.length > 0) sectionStatus = 'complete'
        else if (completedCount > 0) sectionStatus = 'in-progress'
      }
  
      const sectionBadge = {
        complete:      { icon: '✓', cls: 'bg-green-50 text-green-700 border border-green-200' },
        'in-progress': { icon: '◑', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
        incomplete:    { icon: '○', cls: 'bg-gray-100 text-gray-400' },
      }[sectionStatus]
  
      return (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">
                {group.name.replace(/\s*\d+$/, '')}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                sectionStatus === 'complete'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : sectionStatus === 'in-progress'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-gray-100 text-gray-400'
            }`}>
                {requiredCount
                ? `${completedCount} / ${requiredCount}`
                : allCourses.length > 0
                ? `${completedCount} / ${allCourses.length}`
                : null
                }
            </span>
            </div>
          <div className="p-3 flex flex-col gap-2">
            {(group.sub_groups ?? []).map((sub, i) => (
              <SectionBlock
                key={i}
                group={sub}
                isCompleted={isCompleted}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )
    }
  
    if (group.type === 'required' && group.courses?.length > 0) {
      const course = group.courses[0]
      return (
        <Row
          course={course}
          done={isCompleted(course.code)}
          onAdd={() => onAdd(course)}
          onRemove={() => onRemove(course.code)}
        />
      )
    }
  
    if (group.type === 'choose_one' && group.courses?.length > 0) {
      const satisfied = group.courses.some(c => isCompleted(c.code))
      return (
        <div>
          <p className="text-xs text-gray-400 mb-1.5 font-medium">
            {satisfied ? '✓ Satisfied by:' : 'Choose one:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.courses.map(c => (
              <Pill key={c.code} code={c.code} name={c.name}
                done={isCompleted(c.code)}
                onAdd={() => onAdd(c)}
                onRemove={() => onRemove(c.code)} />
            ))}
          </div>
        </div>
      )
    }
  
    if (group.type === 'label' && group.name) {
      return <p className="text-xs text-gray-500 font-medium">{group.name}</p>
    }
  
    return null
  }
  
  // Helper — collect all leaf courses from a group tree
  function getAllCoursesInGroup(group) {
    const courses = []
    if (group.type === 'section') {
      for (const sub of group.sub_groups ?? []) {
        courses.push(...getAllCoursesInGroup(sub))
      }
    } else if (group.type === 'required') {
      courses.push(...(group.courses ?? []))
    } else if (group.type === 'choose_one') {
      // For choose_one, only need 1 — treat as single slot
      if (group.courses?.length > 0) courses.push(group.courses[0])
    }
    return courses
  }
  
  // ── PRIMITIVES ────────────────────────────────────────────────────
  
  function Row({ course, done, onAdd, onRemove }) {
    return (
      <button
        onClick={done ? onRemove : onAdd}
        title={course.name}
        className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg border transition-all ${
          done
            ? 'bg-green-50 border-green-200 hover:bg-red-50 hover:border-red-200'
            : 'bg-gray-50 border-gray-200 hover:border-red-200 hover:bg-red-50'
        }`}
      >
        <span className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-xs font-bold ${
          done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'
        }`}>
          {done && '✓'}
        </span>
        <span className={`text-xs font-medium ${done ? 'text-green-700' : 'text-gray-700'}`}>
          {course.code}
        </span>
        {course.name && course.name !== course.code && (
          <span className="text-xs text-gray-400 truncate">{course.name}</span>
        )}
      </button>
    )
  }
  
  function Pill({ code, name, done, onAdd, onRemove }) {
    return (
      <button
        onClick={done ? onRemove : onAdd}
        title={name}
        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
          done
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
        }`}
      >
        {done && <span className="mr-1">✓</span>}
        {code}
      </button>
    )
  }