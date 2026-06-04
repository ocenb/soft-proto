import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'
import ToastContainer from './ToastContainer'

const getLinkClassName = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link'

export default function Layout() {
  const { favorites, token, userName, saveToken, isTokenExpired } = useContext(AppContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    saveToken('')
    navigate('/login')
  }

  const isAuthorized = token && !isTokenExpired()

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
          <NavLink to="/favourites" className={getLinkClassName}>
            Favourites
          </NavLink>
          <NavLink to="/about" className={getLinkClassName}>
            About
          </NavLink>
        </nav>

        <div className="header-right">
          <p className="favorites-counter">Favorites: {favorites.length}</p>
          <div className="auth-indicator">
            {isAuthorized ? (
              <>
                <span className="user-name" title={userName}>👤 {userName}</span>
                <button onClick={handleLogout} className="logout-btn secondary">
                  Выйти
                </button>
              </>
            ) : (
              <NavLink to="/login" className="link-button login-btn">
                Войти
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  )
}

