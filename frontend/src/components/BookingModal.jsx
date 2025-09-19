
import React, { useState } from 'react'
import dayjs from 'dayjs'

export default function BookingModal({ venue, onClose, onBooked }){
  const [name, setName] = useState('Guest')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [days, setDays] = useState(1)
  const [expectedMembers, setExpectedMembers] = useState(50)

  async function submit(e){
    e.preventDefault();
    const payload = { venueId: venue.id, name, date, days, expectedMembers };
    const r = await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(r.ok){ alert('Booked successfully'); onBooked(); } else { const d = await r.json(); alert('Error: '+d.error) }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Book: {venue.name}</h3>
        <form onSubmit={submit}>
          <label>Your name<input value={name} onChange={e=>setName(e.target.value)} required /></label>
          <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required /></label>
          <label>Days<input type="number" min="1" value={days} onChange={e=>setDays(Number(e.target.value))} /></label>
          <label>Expected members<input type="number" min="1" value={expectedMembers} onChange={e=>setExpectedMembers(Number(e.target.value))} /></label>
          <div className="modal-actions">
            <button className="btn primary" type="submit">Confirm booking</button>
            <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
