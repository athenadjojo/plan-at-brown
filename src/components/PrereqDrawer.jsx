import prereqData from '../data/prerequisites.json'

function buildChain(code, visited = new Set(), depth = 0) {
  if (depth > 3 || visited.has(code)) return null
  visited.add(code)
  const prereqs = prereqData[code] ?? []
  return {
    code,
    prereqs: prereqs
      .map(p => buildChain(p, new Set(visited), depth + 1))
      .filter(Boolean)
  }
}

function getUnlocks(code) {
  return Object.entries(prereqData)
    .filter(([, prereqs]) => prereqs.includes(code))
    .map(([c]) => c)
    .slice(0, 6)
}

export default function PrereqDrawer({ course, onClose }) {
  if (!course) return null

  const chain = buildChain(course.code)
  const unlocks = getUnlocks(course.code)
  const hasPrereqs = (prereqData[course.code] ?? []).length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-200 z-40 flex flex-col shadow-lg">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
              Prerequisites
            </p>
            <h2 className="text-sm font-medium text-gray-900">{course.code}</h2>
            {course.name && course.name !== course.code && (
              <p className="text-xs text-gray-400 mt-0.5">{course.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Prereq chain */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              Requires
            </p>
            {!hasPrereqs ? (
              <p className="text-xs text-gray-400 italic">
                No prerequisites — open to all students.
              </p>
            ) : (
              <ChainNode node={chain} isRoot />
            )}
          </div>

          {/* Unlocks */}
          {unlocks.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                Unlocks
              </p>
              <div className="flex flex-col gap-1.5">
                {unlocks.map(code => (
                  <div
                    key={code}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 border border-green-100 rounded-lg"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700">{code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unlocks.length === 0 && !hasPrereqs && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                No downstream courses found.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          
            href={'https://cab.brown.edu/'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-red-700 transition-colors"
          <a>
            View on CAB for full details
          </a>
        </div>
      </div>
    </>
  )
}

function ChainNode({ node, isRoot = false, depth = 0 }) {
  if (!node) return null
  const { code, prereqs } = node

  if (isRoot) {
    return (
      <div className="flex flex-col gap-2">
        {prereqs.map((child, i) => (
          <ChainNode key={i} node={child} depth={0} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700">{code}</span>
        {prereqs.length > 0 && (
          <span className="text-xs text-gray-300">needs</span>
        )}
      </div>
      {prereqs.length > 0 && depth < 2 && (
        <div className="ml-3 pl-2 border-l border-gray-100 flex flex-col gap-1">
          {prereqs.map((child, i) => (
            <ChainNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}