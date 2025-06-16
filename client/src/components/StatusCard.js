import React from 'react';
import { useSSE } from '../hooks/UseSSE';
import DisconnectButton from './DisconnectButton';
import D3Screen from './D3Screen';
import StatusTextArea from './StatusTextArea';

const StatusCard = () => {
  const {
    events,
    connectionStatus,
    clientId,
    error,
    isConnected,
    connect,
    disconnect,
    reconnect,
    clearEvents,
    getStats
  } = useSSE();

  const stats = getStats();

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'connected': return 'connection-status connected';
      case 'connecting': return 'connection-status connecting';
      case 'disconnected': return 'connection-status disconnected';
      default: return 'connection-status disconnected';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return `Connected (${clientId || 'Unknown ID'})`;
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="status-card">
      <div className="status-card-header">
        <h2 className="status-card-title">SSE Status Monitor</h2>
        <DisconnectButton
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          disabled={connectionStatus === 'connecting'}
        />
      </div>

      {/* Connection Status Banner */}
      <div className={getConnectionStatusClass()}>
        {getConnectionStatusText()}
        {error && (
          <div style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.8 }}>
            Error: {error.message || 'Connection failed'}
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Events:</span>
          <span className="stat-value">{stats.totalEvents}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Status Updates:</span>
          <span className="stat-value">{stats.statusEvents}</span>
        </div>
        {stats.latestStatus && (
          <div className="stat-item">
            <span className="stat-label">Latest Status:</span>
            <span className="stat-value">{stats.latestStatus.status}</span>
          </div>
        )}
      </div>

      {/* D3.js Visualization Screen */}
      <D3Screen 
        events={events} 
        connectionStatus={connectionStatus}
      />

      {/* Status Text Area */}
      <StatusTextArea 
        events={events} 
        clearEvents={clearEvents}
      />

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={reconnect}
          className="action-button reconnect-button"
          disabled={connectionStatus === 'connecting'}
        >
          Reconnect
        </button>
        <button 
          onClick={clearEvents}
          className="action-button clear-button"
          disabled={events.length === 0}
        >
          Clear Events
        </button>
      </div>
    </div>
  );
};

export default StatusCard;
