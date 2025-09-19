
import React, { useEffect, useState } from 'react'
import VenueCard from './components/VenueCard.jsx'
import BookingModal from './components/BookingModal.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import AdsPanel from './components/AdsPanel.jsx'

export default function App(){
  const [venues, setVenues] = useState([])
  const [ads, setAds] = useState([])
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(()=>{ refresh() }, [])

  function refresh(){
    fetch('/api/venues').then(r=>r.json()).then(setVenues)
    fetch('/api/ads').then(r=>r.json()).then(setAds)
  }

  function openBooking(venue){ setSelectedVenue(venue); setShowBooking(true) }
  function onBooked(){ setShowBooking(false); setSelectedVenue(null); refresh() }

  async function cancelBookingForVenue(venueId){
    const res = await fetch('/api/bookings'); const data = await res.json();
    const b = data.find(x=>x.venueId === venueId);
    if(!b){ alert('No booking found'); return; }
    await fetch('/api/bookings/'+b.id+'/cancel', { method:'POST' });
    refresh();
  }

  async function buyVenue(venue){
    const name = prompt('Your name to record purchase:') || 'Buyer';
    await fetch('/api/venues/'+venue.id+'/buy', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ buyerName: name }) });
    refresh();
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>Event Venues</h1>
        <div className="tag">Rent or buy beautiful event spaces</div>
      </header>

      <div className="layout">
        <main className="left">
          <div className="controls">
            <input className="search" placeholder="Search venues (name, location, description)" onKeyDown={e=>{ if(e.key==='Enter') { const q=e.target.value; fetch('/api/venues?q='+encodeURIComponent(q)).then(r=>r.json()).then(setVenues) }}} />
            <button className="btn" onClick={refresh}>Refresh</button>
          </div>

          <div className="grid">
            {venues.map(v => <VenueCard key={v.id} venue={v} onBook={()=>openBooking(v)} onCancel={()=>cancelBookingForVenue(v.id)} onBuy={()=>buyVenue(v)} />)}
          </div>
        </main>

        <aside className="right">
          <AdsPanel ads={ads} />
          <ChatPanel />
        </aside>
      </div>

      {showBooking && <BookingModal venue={selectedVenue} onClose={()=>setShowBooking(false)} onBooked={onBooked} />}

    </div>
  )
}
