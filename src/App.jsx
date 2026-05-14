import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ConcentrationPage from './pages/ConcentrationPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/concentration/:slug" element={<ConcentrationPage />} />
      </Routes>
    </div>
  )
}

export default App