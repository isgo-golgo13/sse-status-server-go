// Production-grade SSE Service
class SSEService {
  constructor() {
    this.eventSource = null;
    this.reconnectInterval = 3000; // 3 seconds
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
    this.isManuallyDisconnected = false;
  }

  connect(onMessage, onError, onConnectionChange) {
    // Close existing connection
    this.disconnect();
    this.isManuallyDisconnected = false;

    try {
      // Connect to SSE server on port 8001
      this.eventSource = new EventSource('http://localhost:8001/sse');
      
      // Connection opened
      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
        this.reconnectAttempts = 0;
        onConnectionChange?.('connected');
      };

      // Handle connected event
      this.eventSource.addEventListener('connected', (event) => {
        console.log('SSE connected event received:', event.data);
        onMessage?.({ 
          type: 'connected', 
          data: event.data,
          timestamp: new Date().toISOString()
        });
      });

      // Handle status events
      this.eventSource.addEventListener('status', (event) => {
        console.log('SSE status event received:', event.data);
        onMessage?.({ 
          type: 'status', 
          data: event.data, 
          id: event.lastEventId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle errors and reconnection
      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        
        if (!this.isManuallyDisconnected) {
          onConnectionChange?.('disconnected');
          onError?.(error);
          
          // Attempt reconnection
          this.attemptReconnection(onMessage, onError, onConnectionChange);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      onError?.(error);
      onConnectionChange?.('disconnected');
    }

    return this.eventSource;
  }

  attemptReconnection(onMessage, onError, onConnectionChange) {
    if (this.isManuallyDisconnected) return;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      onConnectionChange?.('connecting');
      
      setTimeout(() => {
        if (!this.isManuallyDisconnected) {
          this.connect(onMessage, onError, onConnectionChange);
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      onConnectionChange?.('failed');
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection manually closed');
    }
  }

  async notifyServerDisconnect(clientId) {
    if (!clientId) return null;
    
    try {
      // Disconnect endpoint is on GoFr server (port 8000)
      const response = await fetch(`http://localhost:8000/disconnect/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server disconnect successful:', result);
      return result;
    } catch (error) {
      console.error('Server disconnect failed:', error);
      throw error;
    }
  }

  getConnectionState() {
    if (!this.eventSource) return 'disconnected';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const sseService = new SSEService();

// Export convenience functions for backward compatibility
export const connectToSSE = (onMessage, onError, onConnectionChange) => {
  return sseService.connect(onMessage, onError, onConnectionChange);
};

export const disconnectSSE = async (clientId) => {
  sseService.disconnect();
  return await sseService.notifyServerDisconnect(clientId);
};
