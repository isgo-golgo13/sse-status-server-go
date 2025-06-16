import React, { useEffect, useRef } from 'react';

const StatusTextArea = ({ events, clearEvents }) => {
  const textAreaRef = useRef(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [events]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatEventContent = (event) => {
    if (event.type === 'connected') {
      return `Connected with Client ID: ${event.data?.clientId}`;
    } else if (event.type === 'status' && event.data) {
      const { status, message, cpu, memory } = event.data;
      return `Status: ${status} | ${message} | CPU: ${cpu} goroutines | Memory: ${memory}MB`;
    }
    return `Raw data: ${event.rawData}`;
  };

  const getEventClass = (event) => {
    return `status-event ${event.type}`;
  };

  return (
    <div className="status-text-area-container">
      <div className="status-text-area-header">
        <h3>Event Log</h3>
        <button 
          onClick={clearEvents}
          className="clear-button"
          disabled={events.length === 0}
        >
          Clear
        </button>
      </div>
      
      <div className="status-text-area" ref={textAreaRef}>
        {events.length === 0 ? (
          <div className="no-events-message">
            No events received yet. Waiting for SSE connection...
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={getEventClass(event)}>
              <div className="status-event-timestamp">
                [{formatTimestamp(event.timestamp)}]
              </div>
              <div className="status-event-content">
                {formatEventContent(event)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="event-counter">
        Total Events: {events.length}
      </div>
    </div>
  );
};

export default StatusTextArea;