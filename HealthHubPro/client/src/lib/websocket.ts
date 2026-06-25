// WebSocket service for real-time notifications

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private messageListeners: Set<(data: any) => void> = new Set();
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  // Connect to WebSocket server
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    try {
      // Enhanced debugging for deployment
      console.log('Location info:', {
        protocol: window.location.protocol,
        host: window.location.host,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: window.location.pathname
      });
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Notify listeners of connection
        this.notifyConnectionListeners(true);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.notifyMessageListeners(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.socket = null;
        
        // Notify listeners of disconnection
        this.notifyConnectionListeners(false);
        
        // Try to reconnect after 5 seconds
        this.reconnectTimer = window.setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          this.connect();
        }, 5000);
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }
  
  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.notifyConnectionListeners(false);
  }
  
  // Send a message to the server
  public send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        this.socket.send(messageStr);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }
  
  // Add a listener for incoming messages
  public addMessageListener(listener: (data: any) => void): void {
    this.messageListeners.add(listener);
  }
  
  // Remove a message listener
  public removeMessageListener(listener: (data: any) => void): void {
    this.messageListeners.delete(listener);
  }
  
  // Add a listener for connection status changes
  public addConnectionListener(listener: (isConnected: boolean) => void): void {
    this.connectionListeners.add(listener);
  }
  
  // Remove a connection listener
  public removeConnectionListener(listener: (isConnected: boolean) => void): void {
    this.connectionListeners.delete(listener);
  }
  
  // Check if the WebSocket is connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Notify all message listeners of a new message
  private notifyMessageListeners(data: any): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }
  
  // Notify all connection listeners of a connection status change
  private notifyConnectionListeners(isConnected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const websocketService = WebSocketService.getInstance();