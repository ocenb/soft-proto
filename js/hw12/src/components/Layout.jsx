import { NavLink, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'

const getLinkClassName = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link'

export default function Layout() {
  const { favorites } = useContext(AppContext)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Students Catalog</h1>
        <nav className="nav-menu" aria-label="Main navigation">
          <NavLink to="/" className={getLinkClassName} end>
            Home
          </NavLink>
          <NavLink to="/list" className={getLinkClassName}>
            List
          </NavLink>
          <NavLink to="/about" className={getLinkClassName}>
            About
          </NavLink>
        </nav>
        <p className="favorites-counter">Favorites: {favorites.length}</p>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
