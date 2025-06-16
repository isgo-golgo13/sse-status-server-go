import { useState, useEffect, useCallback, useRef } from 'react';
import { sseService } from '../services/SSEService';

export const useSSE = () => {
  const [events, setEvents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState(null);
  const isConnectedRef = useRef(false);

  // Add new event to the events array
  const addEvent = useCallback((event) => {
    const processedEvent = {
      id: event.id || Date.now().toString(),
      type: event.type,
      timestamp: event.timestamp || new Date().toISOString(),
      data: null,
      rawData: event.data
    };

    // Parse the event data based on type
    try {
      if (event.type === 'connected') {
        const connectedData = JSON.parse(event.data);
        processedEvent.data = connectedData;
        setClientId(connectedData.clientId);
      } else if (event.type === 'status') {
        // Handle nested JSON structure from server
        const outerData = JSON.parse(event.data);
        const statusData = JSON.parse(outerData.data);
        processedEvent.data = statusData;
      }
    } catch (parseError) {
      console.error('Error parsing event data:', parseError);
      processedEvent.data = { error: 'Failed to parse event data' };
    }

    setEvents(prev => {
      // Keep only the last 50 events for performance
      const newEvents = [...prev, processedEvent];
      return newEvents.slice(-50);
    });
  }, []);

  // Handle SSE messages
  const handleMessage = useCallback((event) => {
    setError(null);
    addEvent(event);
  }, [addEvent]);

  // Handle SSE errors
  const handleError = useCallback((error) => {
    console.error('SSE Error:', error);
    setError(error);
  }, []);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status) => {
    setConnectionStatus(status);
    isConnectedRef.current = status === 'connected';
  }, []);

  // Connect to SSE
  const connect = useCallback(() => {
    if (isConnectedRef.current) {
      console.log('Already connected');
      return;
    }

    setError(null);
    setEvents([]);
    setConnectionStatus('connecting');
    
    sseService.connect(handleMessage, handleError, handleConnectionChange);
  }, [handleMessage, handleError, handleConnectionChange]);

  // Disconnect from SSE
  const disconnect = useCallback(async () => {
    try {
      // Notify server if we have a client ID
      if (clientId) {
        await sseService.notifyServerDisconnect(clientId);
      }
    } catch (error) {
      console.error('Error notifying server of disconnect:', error);
    } finally {
      // Always disconnect locally
      sseService.disconnect();
      setConnectionStatus('disconnected');
      setClientId(null);
      setError(null);
      isConnectedRef.current = false;
    }
  }, [clientId]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (isConnectedRef.current) {
        sseService.disconnect();
      }
    };
  }, [connect]); // Fixed: included connect in dependencies

  // Reconnect function for manual retry
  const reconnect = useCallback(() => {
    disconnect().then(() => {
      setTimeout(connect, 1000); // Wait 1 second before reconnecting
    });
  }, [disconnect, connect]);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Get latest status data
  const getLatestStatus = useCallback(() => {
    const statusEvents = events.filter(event => event.type === 'status');
    return statusEvents.length > 0 ? statusEvents[statusEvents.length - 1].data : null;
  }, [events]);

  // Get connection statistics
  const getStats = useCallback(() => {
    const statusEvents = events.filter(event => event.type === 'status');
    const connectedEvents = events.filter(event => event.type === 'connected');
    
    return {
      totalEvents: events.length,
      statusEvents: statusEvents.length,
      connectionEvents: connectedEvents.length,
      isConnected: connectionStatus === 'connected',
      clientId,
      latestStatus: getLatestStatus()
    };
  }, [events, connectionStatus, clientId, getLatestStatus]);

  return {
    // State
    events,
    connectionStatus,
    clientId,
    error,
    isConnected: connectionStatus === 'connected',
    
    // Actions
    connect,
    disconnect,
    reconnect,
    clearEvents,
    
    // Utilities
    getLatestStatus,
    getStats
  };
};
