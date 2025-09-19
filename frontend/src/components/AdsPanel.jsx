
import React from 'react'

export default function AdsPanel({ads}){
  return (
    <div className="ads card">
      <h3>Sponsored</h3>
      {ads.map(a=> <div key={a.id} className="ad-item">
        <img src={a.image} alt={a.title} />
        <div className="ad-title">{a.title}</div>
      </div>)}
    </div>
  )
}
