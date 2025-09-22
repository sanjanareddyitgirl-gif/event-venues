
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static images (ads & venue images)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/ads', express.static(path.join(__dirname, 'public', 'ads')));

// SQLite DB (file stored in backend directory)
const dbFile = path.join(__dirname, 'data', 'venues.db');
const fs = require('fs');
// SmythOS integration variables and helper
const SMYTHOS_API_KEY = process.env.SMYTHOS_API_KEY || '';
const SMYTHOS_AGENT_ID = process.env.SMYTHOS_AGENT_ID || '';

function compactVenues(rows, limit = 6) {
  return rows.slice(0, limit).map(v => ({
    id: v.id,
    name: v.name,
    capacity: v.capacity,
    rent_per_day: v.price_rent_per_day,
    sell_price: v.price_sell,
    location: v.location,
    status: v.status
  }));
}

const dbDir = path.join(__dirname, 'data');
if(!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbFile);

db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS venues(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    capacity INTEGER,
    price_sell REAL,
    price_rent_per_day REAL,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'available',
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venueId INTEGER,
    name TEXT,
    date TEXT,
    days INTEGER,
    expectedMembers INTEGER,
    createdAt TEXT
  )`);

  // Seed data after tables are created
  seedVenues();
});

// Seed data (10 venues)
function seedVenues() {
  db.get("SELECT COUNT(*) as c FROM venues", (err, row) => {
    if (err) return console.error(err);
    if (row.c > 0) {
      console.log("Venues already exist in DB, skipping seed.");
      return;
    }
    const venues = [
      ['Grand Hall','Indoor',300,500000,2500,'Downtown','Large hall for weddings & conferences','/images/venue1.jpg'],
      ['Sunset Garden','Outdoor',150,200000,1200,'Riverside','Open garden perfect for ceremonies','/images/venue2.jpg'],
      ['Rooftop Terrace','Outdoor',80,120000,900,'City Center','Stylish rooftop with skyline views','/images/venue3.jpg'],
      ['The Glass Pavilion','Indoor',220,420000,2200,'Harbor','Modern glass pavilion with sea view','/images/venue4.jpg'],
      ['Meadow Park','Outdoor',400,750000,3200,'Uptown','Expansive parkland ideal for festivals','/images/venue5.jpg'],
      ['Studio Loft','Indoor',60,90000,650,'Arts District','Cozy loft space for private events','/images/venue6.jpg'],
      ['Crystal Ballroom','Indoor',500,950000,5000,'Grand Avenue','Opulent ballroom with chandelier','/images/venue7.jpg'],
      ['Harbor Deck','Outdoor',120,150000,1100,'Harborfront','Open deck overlooking the harbor','/images/venue8.jpg'],
      ['Maple Conference Center','Indoor',180,300000,1800,'Business Park','Professional conference facilities','/images/venue9.jpg'],
      ['Orchid Conservatory','Indoor',90,175000,1000,'Botanic Gardens','Indoor conservatory with plants & light','/images/venue10.jpg']
    ];
    const stmt = db.prepare("INSERT INTO venues(name,type,capacity,price_sell,price_rent_per_day,location,description,image) VALUES (?,?,?,?,?,?,?,?)");
    for (const v of venues) stmt.run(...v);
    stmt.finalize();
    console.log("Seeded 10 venues into DB.");
  });
}

// API endpoints
app.get('/api/venues', (req, res) => {
  const q = req.query.q;
  const host = req.protocol + '://' + req.get('host');

  function fixImages(rows) {
    rows.forEach(v => {
      if (v.image && !v.image.startsWith('http')) {
        v.image = host + v.image;   // prepend host
      }
    });
    return rows;
  }

  if (q) {
    const qlike = '%' + q + '%';
    db.all(
      "SELECT * FROM venues WHERE name LIKE ? OR location LIKE ? OR description LIKE ?",
      [qlike, qlike, qlike],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(fixImages(rows));
      }
    );
  } else {
    db.all("SELECT * FROM venues", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(fixImages(rows));
    });
  }
});


app.get('/api/venues/:id', (req,res)=>{
  db.get("SELECT * FROM venues WHERE id=?", [req.params.id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'not found'});
    res.json(row);
  });
});

app.post('/api/bookings', (req,res)=>{
  const { venueId, name, date, days, expectedMembers } = req.body;
  if(!venueId || !name) return res.status(400).json({error:'venueId and name required'});
  db.run("INSERT INTO bookings(venueId,name,date,days,expectedMembers,createdAt) VALUES (?,?,?,?,?,datetime('now'))",
    [venueId,name,date||'',days||1,expectedMembers||0], function(err){
      if(err) return res.status(500).json({error:err.message});
      db.run("UPDATE venues SET status='rented' WHERE id=?", [venueId]);
      res.json({success:true, bookingId:this.lastID});
    });
});

app.get('/api/bookings', (req,res)=>{
  db.all("SELECT * FROM bookings", (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.post('/api/bookings/:id/cancel', (req,res)=>{
  const id = req.params.id;
  db.get("SELECT * FROM bookings WHERE id=?", [id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'not found'});
    db.run("DELETE FROM bookings WHERE id=?", [id], function(err){
      if(err) return res.status(500).json({error:err.message});
      db.run("UPDATE venues SET status='available' WHERE id=?", [row.venueId]);
      res.json({success:true});
    });
  });
});

app.post('/api/venues/:id/buy', (req,res)=>{
  const { buyerName } = req.body;
  const id = req.params.id;
  db.run("UPDATE venues SET status='sold' WHERE id=?", [id], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({success:true});
  });
});

// Ads endpoint: returns list with full absolute URLs
// Ads endpoint: returns list with full absolute URLs
app.get('/api/ads', (req, res) => {
  const host = req.protocol + '://' + req.get('host');
  const ads = [
    { id: 'ad1', title: 'BlueCaterers - 10% OFF', image: host + '/ads/ad1.jpg', link: '#' },
    { id: 'ad2', title: 'StageMax - Pro Sound', image: host + '/ads/ad2.jpg', link: '#' },
    { id: 'ad3', title: 'Spark Lighting - Deals', image: host + '/ads/ad3.jpg', link: '#' },
    { id: 'ad4', title: 'FloralArt - Wedding Flowers', image: host + '/ads/ad4.jpg', link: '#' },
    { id: 'ad5', title: 'SecureGuard - Event Security', image: host + '/ads/ad5.jpg', link: '#' }
  ];
  res.json(ads);
});


// Simple AI agent that answers based on venue data

// In production, serve frontend from ../frontend/dist if exists
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
//const fs = require('fs');
// SmythOS integration variables and helper

function compactVenues(rows, limit = 6) {
  return rows.slice(0, limit).map(v => ({
    id: v.id,
    name: v.name,
    capacity: v.capacity,
    rent_per_day: v.price_rent_per_day,
    sell_price: v.price_sell,
    location: v.location,
    status: v.status
  }));
}

if(fs.existsSync(distPath)){
  app.use(express.static(distPath));
  app.get('*', (req,res) => res.sendFile(path.join(distPath, 'index.html')));
}


// Agent endpoint: proxies to SmythOS if credentials are configured, otherwise uses offline responder.
app.post('/api/agent/query', (req, res) => {
  const message = (req.body && req.body.message) ? String(req.body.message) : '';
  if (!message) return res.status(400).json({ error: 'message required' });

  // Offline responder if no creds
  if (!SMYTHOS_API_KEY || !SMYTHOS_AGENT_ID) {
    db.all("SELECT * FROM venues", (err, rows) => {
      if (err) return res.json({ reply: 'Error reading venues.' });
      const text = message.toLowerCase();
      const capMatch = text.match(/(\d+)\s*(guests|people|persons|members)/);
      if (capMatch) {
        const n = Number(capMatch[1]);
        const suitable = rows.filter(v => v.capacity >= n);
        if (suitable.length) {
          const list = suitable.map(v => `${v.name} (capacity ${v.capacity}, rent/day $${v.price_rent_per_day})`).slice(0,8).join('\n');
          return res.json({ reply: `I found ${suitable.length} venues that fit ${n} guests:\n${list}`, simulated: true });
        } else {
          return res.json({ reply: `No venues found that can fit ${n} guests.`, simulated: true });
        }
      }
      for (const v of rows) {
        if (message.toLowerCase().includes((v.name || '').toLowerCase().split(' ')[0])) {
          return res.json({ reply: `${v.name}: ${v.description}\nCapacity ${v.capacity}, Rent/day $${v.price_rent_per_day}, Sell $${v.price_sell}, Location ${v.location}, Status ${v.status}`, simulated: true });
        }
      }
      return res.json({ reply: "I can help with venue info. Try 'Which venue fits 200 guests?' or 'Tell me about Grand Palace Hotel'.", simulated: true });
    });
    return;
  }

  // Use SmythOS
  db.all("SELECT id,name,capacity,price_rent_per_day,price_sell,location,description,status FROM venues", async (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    const capMatch = message.match(/(\d+)\s*(guests|people|persons|members)/);
    let contextVenues = [];
    if (capMatch) {
      const n = Number(capMatch[1]);
      contextVenues = rows.filter(v => v.capacity >= n).slice(0,6);
    } else {
      contextVenues = compactVenues(rows, 6);
    }

    const payload = {
      input: message,
      context: {
        venues: contextVenues,
        instructions: "You are a Venue Assistant. Use the provided venues list to answer precisely and concisely. When the user asks about booking, instruct them to use the Book button with date and expected members."
      }
    };

    try {
      const endpoint = `https://api.smythos.com/v1/agents/${SMYTHOS_AGENT_ID}/invoke`;
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SMYTHOS_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      const tokensUsed = (data.usage && data.usage.total_tokens) || data.tokensUsed || 0;
      db.run("INSERT INTO token_usage(call_time, tokens, simulated) VALUES (datetime('now'), ?, 0)", [tokensUsed]);
      const reply = data.output || data.reply || (typeof data === 'string' ? data : JSON.stringify(data));
      res.json({ reply, raw: data, tokensUsed });
    } catch (err) {
      console.error('SmythOS proxy fail', err);
      res.status(500).json({ error: 'agent proxy failed', details: String(err) });
    }
  });
});

app.listen(PORT, ()=> console.log('Backend running on port', PORT));
