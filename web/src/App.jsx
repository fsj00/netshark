import { Routes, Route } from 'react-router-dom'
import Header from './components/Layout/Header'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'

function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
