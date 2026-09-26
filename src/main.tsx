import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { SkillIndex } from './pages/inggris/SkillIndex'
import { SkillLevelPicker } from './pages/inggris/SkillLevelPicker'
import { SkillLesson } from './pages/inggris/SkillLesson'
import { ReviewPage } from './pages/inggris/EnReview'
import { ProgressProvider } from './lib/progressContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registerPwa } from './lib/pwa'
import './styles.css'

registerPwa()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ProgressProvider>
          <Routes>
            {/* App utama (onboarding, beranda, permainan) memakai navigasi internal */}
            <Route path="/*" element={<App />} />
            {/* Ulang Cerdas per bahasa (rute 'ulang' lebih spesifik dari :skillSlug) */}
            <Route path="/:langSlug/ulang" element={<ReviewPage />} />
            {/* Halaman ber-URL per bahasa + latihan + kategori + tingkat */}
            <Route path="/:langSlug/:skillSlug" element={<SkillIndex />} />
            <Route path="/:langSlug/:skillSlug/:categoryId" element={<SkillLevelPicker />} />
            <Route path="/:langSlug/:skillSlug/:categoryId/:level" element={<SkillLesson />} />
          </Routes>
        </ProgressProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
