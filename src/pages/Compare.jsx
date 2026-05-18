export default function Compare() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center animate-in">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 mb-4">
        <svg className="w-6 h-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Compare</h1>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Coming soon — compare requirements side-by-side to find the right concentration for you.
      </p>
    </div>
  )
}
