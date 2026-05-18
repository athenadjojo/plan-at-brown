import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ConcentrationPage from './pages/ConcentrationPage'
import Analytics from './pages/Analytics'
import Compare from './pages/Compare'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/concentration/:slug" element={<ConcentrationPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
    </div>
  )
}

export default App
