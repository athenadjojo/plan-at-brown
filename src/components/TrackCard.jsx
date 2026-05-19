import { useState } from 'react'
import PrereqDrawer from './PrereqDrawer'

export default function TrackCard({ track, degree, completedCourses, onAdd, onRemove }) {
  const [drawerCourse, setDrawerCourse] = useState(null)
  const completedCodes = completedCourses.map(c => c.code)
  const isCompleted = (code) => completedCodes.includes(code)

  const isStructured = ['choose_one_series','choose_one','one_per_area','electives','capstone']
    .includes(track.type)

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

  const flat = track.courses ?? []
  const flatDone = flat.filter(c =>
    c.type === 'required'
      ? isCompleted(c.course.code)
      : c.options?.some(o => isCompleted(o.code))
  ).length

  return (
    <>
      <div className={`bg-white border rounded-xl p-5 transition-colors duration-300 ${style.border}`}>

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
                      onRemove={() => onRemove(code)}
                      onPrereq={() => setDrawerCourse({ code, name: code })} />
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
                onRemove={() => onRemove(c.code)}
                onPrereq={() => setDrawerCourse(c)} />
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
                      onRemove={() => onRemove(c.code)}
                      onPrereq={() => setDrawerCourse(c)} />
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
                .map(c => (
                  <Pill key={c.code} code={c.code} done
                    onRemove={() => onRemove(c.code)}
                    onPrereq={() => setDrawerCourse(c)} />
                ))}
            </div>
            {track.approved_outside_courses && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">Approved outside courses</p>
                <div className="flex flex-wrap gap-2">
                  {track.approved_outside_courses.map(c => (
                    <Pill key={c.code} code={c.code} name={c.name} done={isCompleted(c.code)}
                      onAdd={() => onAdd({ code: c.code, name: c.name })}
                      onRemove={() => onRemove(c.code)}
                      onPrereq={() => setDrawerCourse(c)} />
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

        {/* ── SCRAPED FORMAT ── */}
        {!isStructured && (
          <div className="flex flex-col gap-3">
            {(track.groups ?? []).map((group, i) => (
              <SectionBlock
                key={i}
                group={group}
                isCompleted={isCompleted}
                onAdd={onAdd}
                onRemove={onRemove}
                onPrereq={setDrawerCourse}
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

      {/* Prereq drawer — renders outside the card so it can overlay the full page */}
      {drawerCourse && (
        <PrereqDrawer
          course={drawerCourse}
          onClose={() => setDrawerCourse(null)}
        />
      )}
    </>
  )
}

function SectionBlock({ group, isCompleted, onAdd, onRemove, onPrereq, locked = false }) {
  if (!group) return null

  if (group.type === 'section') {
    const allCourses = getAllCoursesInGroup(group)
    const requiredCount = group.count ?? allCourses.length
    const completedCount = allCourses.filter(c => isCompleted(c.code)).length
    const isMet = completedCount >= requiredCount

    let sectionStatus = 'incomplete'
    if (completedCount >= requiredCount) sectionStatus = 'complete'
    else if (completedCount > 0) sectionStatus = 'in-progress'

    return (
      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">
            {group.name.replace(/\s*\d+$/, '')}
          </p>
          <span className={
            'text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-300 ' +
            (sectionStatus === 'complete'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : sectionStatus === 'in-progress'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-gray-100 text-gray-400')
          }>
            {completedCount} / {requiredCount}
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
              onPrereq={onPrereq}
              locked={isMet && !isCompleted(getAllCoursesInGroup(sub)[0]?.code)}
            />
          ))}
        </div>
        {isMet && requiredCount > 0 && (
          <div className="px-3 py-1.5 bg-green-50 border-t border-green-100">
            <p className="text-xs text-green-600 font-medium">Requirement met</p>
          </div>
        )}
      </div>
    )
  }

  if (group.type === 'required' && group.courses?.length > 0) {
    const course = group.courses[0]
    const done = isCompleted(course.code)
    return (
      <Row
        course={course}
        done={done}
        locked={locked && !done}
        onAdd={() => !locked && onAdd(course)}
        onRemove={() => onRemove(course.code)}
        onPrereq={() => onPrereq(course)}
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
            <Pill
              key={c.code}
              code={c.code}
              name={c.name}
              done={isCompleted(c.code)}
              locked={locked && !isCompleted(c.code)}
              onAdd={() => !locked && onAdd(c)}
              onRemove={() => onRemove(c.code)}
              onPrereq={() => onPrereq(c)}
            />
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

function getAllCoursesInGroup(group) {
  const courses = []
  if (group.type === 'section') {
    for (const sub of group.sub_groups ?? []) {
      courses.push(...getAllCoursesInGroup(sub))
    }
  } else if (group.type === 'required') {
    courses.push(...(group.courses ?? []))
  } else if (group.type === 'choose_one') {
    if (group.courses?.length > 0) courses.push(group.courses[0])
  }
  return courses
}

function Row({ course, done, locked, onAdd, onRemove, onPrereq }) {
  return (
    <div className={
      'flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-all group ' +
      (locked
        ? 'bg-gray-50 border-gray-100 opacity-40'
        : done
        ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-400'
        : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300')
    }>
      {/* Checkbox + code + name — clicking toggles completion */}
      <button
        onClick={done ? onRemove : onAdd}
        disabled={locked}
        className="flex items-center gap-2 flex-1 text-left cursor-pointer disabled:cursor-not-allowed"
        title={locked ? 'Requirement already met' : course.name}
      >
        <span className={
          'flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-xs font-bold ' +
          (done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white')
        }>
          {done && (
            <>
              <span className="group-hover:hidden">✓</span>
              <span className="hidden group-hover:inline text-red-500">×</span>
            </>
          )}
        </span>
        <span className={'text-xs font-medium ' + (done ? 'text-green-700' : 'text-gray-700')}>
          {course.code}
        </span>
        {course.name && (
          <span className="text-xs text-gray-400 truncate">{course.name}</span>
        )}
        {locked && (
          <span className="ml-auto text-xs text-gray-300 whitespace-nowrap">req. met</span>
        )}
      </button>

      {/* Prereq button — separate from the toggle */}
      {!locked && (
        <button
          onClick={onPrereq}
          className="text-xs text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0 px-1 py-0.5 rounded hover:bg-blue-50"
          title="View prerequisites"
        >
          prereqs
        </button>
      )}
    </div>
  )
}

function Pill({ code, name, done, locked, onAdd, onRemove, onPrereq }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={done ? onRemove : onAdd}
        disabled={locked}
        title={locked ? 'Requirement already met' : name}
        className={
          'text-xs px-3 py-1.5 rounded-full border pressable flex items-center gap-1.5 group ' +
          (locked
            ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
            : done
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400'
            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300')
        }
      >
        {done && (
          <>
            <span className="group-hover:hidden">✓</span>
            <span className="hidden group-hover:inline">×</span>
          </>
        )}
        <span className="font-medium">{code}</span>
        {name && name !== code && (
          <span className="text-gray-400 font-normal">{name}</span>
        )}
      </button>
      {onPrereq && !locked && (
        <button
          onClick={onPrereq}
          className="text-xs text-gray-300 hover:text-blue-500 transition-colors px-1"
          title="View prerequisites"
        >
          ·
        </button>
      )}
    </div>
  )
}
