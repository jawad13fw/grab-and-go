import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Global socket instance
let socketInstance = null;
let connectPromise = null;

const getSocketInstance = () => {
  // If we already have a connected socket, return it
  if (socketInstance?.connected) {
    return Promise.resolve(socketInstance);
  }
  
  // If we're already trying to connect, return the existing promise
  if (connectPromise) {
    return connectPromise;
  }
  
  // Create new connection — httpOnly cookie is sent via withCredentials
  connectPromise = new Promise((resolve) => {
    const newSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      socketInstance = newSocket;
      connectPromise = null;
      resolve(newSocket);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      connectPromise = null;
      resolve(null);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });
  });
  
  return connectPromise;
};

export const useSocket = () => {
  const { currentUser } = useAuthStore();
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    if (!currentUser) {
      // Disconnect if logged out
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      setSocket(null);
      return;
    }
    
    // Get or create socket connection
    getSocketInstance().then((s) => {
      if (s) setSocket(s);
    });
    
    return () => {
      // Don't disconnect on unmount — keep global instance alive
    };
  }, [currentUser]);
  
  return socket;
};

// Hook for subscribing to order updates
export const useOrderTracking = (orderId) => {
  const socket = useSocket();
  const { currentUser } = useAuthStore();
  
  useEffect(() => {
    if (!socket || !orderId || !currentUser) return;
    
    // Subscribe to order updates
    socket.emit('subscribe', { orderId, userId: currentUser.id });
    
    // Cleanup subscription
    return () => {
      socket.emit('unsubscribe', { orderId });
    };
  }, [socket, orderId, currentUser]);
  
  return socket;
};

// Hook for rider location updates
export const useRiderLocation = (riderId) => {
  const socket = useSocket();
  
  const updateLocation = (lat, lng, orderId) => {
    if (!socket || !riderId) return;
    
    socket.emit('rider:location', {
      riderId,
      orderId,
      lat,
      lng
    });
  };
  
  return { socket, updateLocation };
};

// Hook for order status updates
export const useOrderStatus = (orderId) => {
  const socket = useSocket();
  
  const updateStatus = (status) => {
    if (!socket || !orderId) return;
    
    socket.emit('order:status_update', {
      orderId,
      status,
      updatedBy: 'frontend'
    });
  };
  
  return { socket, updateStatus };
};

export default useSocket;
