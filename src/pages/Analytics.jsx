export default function Analytics() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center animate-in">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 mb-4">
        <svg className="w-6 h-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Coming soon — track your progress across concentrations and see how your courses count.
      </p>
    </div>
  )
}
