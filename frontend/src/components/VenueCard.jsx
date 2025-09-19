
import React from 'react'

export default function VenueCard({ venue, onBook, onCancel, onBuy }){
  const statusClass = venue.status === 'available' ? 'badge green' : (venue.status === 'rented' ? 'badge orange' : 'badge red');
  return (
    <div className="venue-card">
<img
  src={venue.image}
  alt={venue.name}
  className="venue-img"
/>

      <div className="venue-body">
        <div className="title-row">
          <h3>{venue.name}</h3>
          <div className={statusClass}>{venue.status}</div>
        </div>
        <div className="desc">{venue.description}</div>
        <div className="meta">Capacity: <strong>{venue.capacity}</strong> | Rent/day: <strong>${venue.price_rent_per_day}</strong> | Sell: <strong>${venue.price_sell}</strong></div>
        <div className="actions">
          <button className="btn primary" onClick={onBook} disabled={venue.status !== 'available'}>Book</button>
          <button className="btn ghost" onClick={onBuy} disabled={venue.status !== 'available'}>Buy</button>
          <button className="btn warn" onClick={onCancel} disabled={venue.status !== 'rented'}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
