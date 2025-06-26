import { useEffect, useRef } from 'react';

const useWebSocket = (url, onMessage, onOpen, onClose, onError) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef(null);

  const connect = () => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = (event) => {
      reconnectAttempts.current = 0;
      console.log('[WebSocket] Connected');
      if (typeof onOpen === 'function') onOpen(event);
    };

    ws.current.onmessage = (event) => {
      if (typeof onMessage === 'function') onMessage(JSON.parse(event.data));
    };

    ws.current.onclose = (event) => {
      console.log('[WebSocket] Closed', event, 'code:', event.code, 'wasClean:', event.wasClean);
      if (typeof onClose === 'function') onClose(event);
      if (event.code === 1006 && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[WebSocket] Attempting reconnect #${reconnectAttempts.current} in ${delay}ms`);
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, delay);
      } else if (event.code !== 1000 && event.code !== 1005 && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[WebSocket] Attempting reconnect #${reconnectAttempts.current} in ${delay}ms (abnormal code)`);
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        if (event.code === 1000) {
          console.log('[WebSocket] Normal closure, no reconnect.');
        } else if (event.code === 1005) {
          console.log('[WebSocket] No status received (1005), not reconnecting.');
        } else {
          console.log('[WebSocket] Max reconnect attempts reached or not reconnecting for this code.');
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      if (typeof onError === 'function') onError(error);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
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
