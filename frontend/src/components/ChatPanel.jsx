
import React, { useState, useRef, useEffect } from 'react'

export default function ChatPanel(){
  const [messages, setMessages] = useState([{ who:'agent', text:'Hello! Ask me about venue capacity, availability, or details. Example: "Which venue fits 200 guests?"' }])
  const [input, setInput] = useState('')
  const boxRef = useRef(null)

  useEffect(()=>{ if(boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [messages])

  async function send(){
    if(!input.trim()) return;
    const mine = { who:'me', text: input }
    setMessages(m => [...m, mine])
    setInput('')
    try {
      const r = await fetch('/api/agent/query', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: input })});
      const d = await r.json();
      setMessages(m => [...m, mine, { who:'agent', text: d.reply }]);
    } catch (err) {
      setMessages(m => [...m, mine, { who:'agent', text: 'Agent error' }]);
    }
  }

  return (
    <div className="chat card">
      <h3>Venue Assistant</h3>
      <div className="chat-box" ref={boxRef}>
        {messages.map((m,i)=>(<div key={i} className={'msg '+(m.who==='me'?'me':'agent')}><div className="bubble">{m.text}</div></div>))}
      </div>
      <div className="chat-input">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder='Ask about capacities, prices, availability...' onKeyDown={e=>{ if(e.key==='Enter') send() }} />
        <button className="btn primary" onClick={send}>Send</button>
      </div>
    </div>
  )
}
