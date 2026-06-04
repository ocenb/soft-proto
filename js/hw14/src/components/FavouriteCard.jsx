import React from 'react'
import { Link } from 'react-router-dom'

export const FavouriteCard = React.memo(function FavouriteCard({
  item,
  onRemove,
  onQuantityChange,
}) {
  return (
    <article className="card" data-testid={`favourite-card-${item.id}`}>
      <h3>{item.name}</h3>
      <p>Факультет: {item.faculty}</p>
      <p>Курсов с оценками: {item.gradesCount}</p>
      <p>Средний балл: {item.averageScore}</p>
      
      <div className="row" style={{ alignItems: 'center', margin: '8px 0' }}>
        <span>Количество:</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={{ padding: '4px 8px', minWidth: '30px' }}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span style={{ fontWeight: 'bold', margin: '0 8px' }} data-testid={`quantity-${item.id}`}>
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          style={{ padding: '4px 8px', minWidth: '30px' }}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="row">
        <Link className="link-button" to={`/list/${item.id}`} style={{ flex: 1, textAlign: 'center' }}>
          Подробнее
        </Link>
        <button
          type="button"
          className="secondary"
          onClick={() => onRemove(item.id)}
          style={{ flex: 1 }}
        >
          Удалить
        </button>
      </div>
    </article>
  )
})
