import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const List = lazy(() => import('./pages/List'))
const Details = lazy(() => import('./pages/Details'))
const Favourites = lazy(() => import('./pages/Favourites'))
const About = lazy(() => import('./pages/About'))

export default function App() {
  return (
    <Suspense fallback={<div className="status" style={{ padding: '24px', textAlign: 'center' }}>Загрузка страницы...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="list" element={<List />} />
          <Route path="list/:id" element={<Details />} />
          <Route path="favourites" element={<Favourites />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

