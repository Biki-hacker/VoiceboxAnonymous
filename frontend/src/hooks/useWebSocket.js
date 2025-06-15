import { useEffect, useRef } from 'react';

const useWebSocket = (url, onMessage, onOpen, onClose, onError) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  let reconnectTimeout = null;

  const connect = () => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = (event) => {
      reconnectAttempts.current = 0;
      if (onOpen) onOpen(event);
    };

    ws.current.onmessage = (event) => {
      if (onMessage) onMessage(JSON.parse(event.data));
    };

    ws.current.onclose = (event) => {
      if (onClose) onClose(event);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff with max 30s
        
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return { sendMessage, ws };
};

export default useWebSocket;
