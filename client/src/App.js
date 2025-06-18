import React from 'react';
import StatusCard from './components/StatusCard';
import './styles/index.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SSE Status Client</h1>
        <p>Real-time Server-Sent Events Visualization</p>
      </header>
      
      <main className="main-content">
        <StatusCard />
      </main>
    </div>
  );
}

export default App;



