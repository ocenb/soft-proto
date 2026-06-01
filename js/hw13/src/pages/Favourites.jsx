import { useContext } from 'react'
import { AppContext } from '../context/app-context'
import { FavouriteCard } from '../components/FavouriteCard'

export default function Favourites() {
  const { favorites, removeFavorite, updateFavoriteQuantity } = useContext(AppContext)

  return (
    <section className="stack">
      <h2>Избранное</h2>
      <p>Здесь находятся выбранные вами товары и сущности, сохранённые между сеансами.</p>

      {favorites.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280', margin: '20px 0' }}>
            В списке избранного пока ничего нет.
          </p>
        </div>
      ) : (
        <div className="grid">
          {favorites.map((item) => (
            <FavouriteCard
              key={item.id}
              item={item}
              onRemove={removeFavorite}
              onQuantityChange={updateFavoriteQuantity}
            />
          ))}
        </div>
      )}
    </section>
  )
}
