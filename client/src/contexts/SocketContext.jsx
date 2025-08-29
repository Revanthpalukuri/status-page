import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
        transports: ['websocket'],
        autoConnect: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or auth change
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Close socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated]);

  // Organization-specific event handlers
  const joinOrganization = (organizationId) => {
    if (socket && isConnected) {
      socket.emit('join-organization', organizationId);
    }
  };

  const leaveOrganization = (organizationId) => {
    if (socket && isConnected) {
      socket.emit('leave-organization', organizationId);
    }
  };

  // Status page event handlers
  const joinStatusPage = (organizationSlug) => {
    if (socket && isConnected) {
      socket.emit('join-status-page', organizationSlug);
    }
  };

  const leaveStatusPage = (organizationSlug) => {
    if (socket && isConnected) {
      socket.emit('leave-status-page', organizationSlug);
    }
  };

  // Event listeners
  const onServiceUpdated = (callback) => {
    if (socket) {
      socket.on('service-updated', callback);
      return () => socket.off('service-updated', callback);
    }
  };

  const onIncidentCreated = (callback) => {
    if (socket) {
      socket.on('incident-created', callback);
      return () => socket.off('incident-created', callback);
    }
  };

  const onIncidentUpdated = (callback) => {
    if (socket) {
      socket.on('incident-updated', callback);
      return () => socket.off('incident-updated', callback);
    }
  };

  const onStatusChanged = (callback) => {
    if (socket) {
      socket.on('status-changed', callback);
      return () => socket.off('status-changed', callback);
    }
  };

  // Generic event listener
  const addEventListener = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  };

  const removeEventListener = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Hook for listening to real-time updates with notifications
  const useRealtimeUpdates = (organizationId, organizationSlug) => {
    useEffect(() => {
      if (!socket || !isConnected) return;

      // Join appropriate rooms
      if (organizationId) {
        joinOrganization(organizationId);
      }
      if (organizationSlug) {
        joinStatusPage(organizationSlug);
      }

      // Service update handler
      const handleServiceUpdate = (data) => {
        toast.success(`Service "${data.serviceName}" status changed to ${data.status}`);
      };

      // Incident handlers
      const handleIncidentCreated = (data) => {
        toast.error(`New incident: ${data.title}`);
      };

      const handleIncidentUpdated = (data) => {
        if (data.status === 'resolved') {
          toast.success(`Incident resolved: ${data.title}`);
        } else {
          toast.info(`Incident update: ${data.title}`);
        }
      };

      // Status change handler
      const handleStatusChange = (data) => {
        const statusColors = {
          operational: 'success',
          degraded_performance: 'warning',
          partial_outage: 'error',
          major_outage: 'error',
          under_maintenance: 'info',
        };

        const toastType = statusColors[data.status] || 'info';
        toast[toastType](`System status: ${data.status.replace('_', ' ')}`);
      };

      // Register event listeners
      socket.on('service-updated', handleServiceUpdate);
      socket.on('incident-created', handleIncidentCreated);
      socket.on('incident-updated', handleIncidentUpdated);
      socket.on('status-changed', handleStatusChange);

      // Cleanup
      return () => {
        if (organizationId) {
          leaveOrganization(organizationId);
        }
        if (organizationSlug) {
          leaveStatusPage(organizationSlug);
        }

        socket.off('service-updated', handleServiceUpdate);
        socket.off('incident-created', handleIncidentCreated);
        socket.off('incident-updated', handleIncidentUpdated);
        socket.off('status-changed', handleStatusChange);
      };
    }, [socket, isConnected, organizationId, organizationSlug]);
  };

  const value = {
    socket,
    isConnected,
    joinOrganization,
    leaveOrganization,
    joinStatusPage,
    leaveStatusPage,
    onServiceUpdated,
    onIncidentCreated,
    onIncidentUpdated,
    onStatusChanged,
    addEventListener,
    removeEventListener,
    useRealtimeUpdates,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
