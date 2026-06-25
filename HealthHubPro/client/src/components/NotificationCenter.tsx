import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, Clock, AlertTriangle, Info, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Prescription } from '@shared/schema';
import { cn } from '@/lib/utils';
import { websocketService } from '@/lib/websocket';

export type NotificationType = 'reminder' | 'success' | 'info' | 'warning';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  data?: any; // Optional additional data
}

interface NotificationCenterProps {
  prescriptions: Prescription[];
}

export default function NotificationCenter({ prescriptions }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Add a new notification
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setHasUnread(true);
    setUnreadCount(prev => prev + 1);
    
    // Play appropriate notification sound based on type
    import('../utils/notificationSounds').then(module => {
      const { playNotification } = module;
      
      // Use the appropriate sound type
      if (notification.type === 'reminder') {
        playNotification('reminder');
      } else if (notification.type === 'success') {
        playNotification('success');
      } else if (notification.type === 'warning') {
        playNotification('warning');
      } else {
        playNotification('default');
      }
    }).catch(err => console.error('Failed to load notification sounds:', err));
  }, []);
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WebSocket message received in NotificationCenter:', data);
    
    // Handle different message types
    if (data.type === 'notification') {
      // Create a notification from the WebSocket message
      const notification: Notification = {
        id: `ws-${Date.now()}`,
        title: data.title || 'New Notification',
        message: data.message || '',
        type: (data.notificationType as NotificationType) || 'info',
        timestamp: new Date(),
        read: false,
        data: data.data
      };
      
      addNotification(notification);
    } 
    else if (data.type === 'reminder') {
      // Handle reminders specifically
      const notification: Notification = {
        id: `reminder-${Date.now()}`,
        title: 'Medication Reminder',
        message: data.message || 'Time to take your medication',
        type: 'reminder',
        timestamp: new Date(),
        read: false,
        data: data.data
      };
      
      addNotification(notification);
    }
    else if (data.type === 'heartbeat') {
      console.log('Received heartbeat from server:', data.timestamp);
    }
  }, [addNotification]);
  
  // Handle WebSocket connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    
    // Add system notification for connection status
    const notification: Notification = {
      id: `connection-${Date.now()}`,
      title: connected ? 'Connected' : 'Disconnected',
      message: connected ? 
        'Connected to notification server' : 
        'Lost connection to notification server. Reconnecting...',
      type: connected ? 'success' : 'warning',
      timestamp: new Date(),
      read: false
    };
    
    addNotification(notification);
  }, [addNotification]);
  
  // Setup WebSocket connection
  useEffect(() => {
    // Connect to WebSocket server
    websocketService.connect();
    
    // Add message and connection listeners
    websocketService.addMessageListener(handleWebSocketMessage);
    websocketService.addConnectionListener(handleConnectionChange);
    
    // Clean up on unmount
    return () => {
      websocketService.removeMessageListener(handleWebSocketMessage);
      websocketService.removeConnectionListener(handleConnectionChange);
    };
  }, [handleWebSocketMessage, handleConnectionChange]);

  // Create notifications from prescriptions on component mount
  useEffect(() => {
    if (prescriptions && prescriptions.length > 0) {
      const now = new Date();
      
      // Create notifications for upcoming medications
      const medicationNotifications: Notification[] = prescriptions.map(prescription => {
        return {
          id: `med-${prescription.id}`,
          title: 'Upcoming Medication',
          message: `Remember to take ${prescription.medicineName} at ${prescription.reminderTime}`,
          type: 'reminder',
          timestamp: now,
          read: false,
          data: prescription
        };
      });

      // Add a welcome notification
      const welcomeNotification: Notification = {
        id: 'welcome',
        title: 'Welcome to MediCare Assistant',
        message: 'Track your medications and get timely reminders!',
        type: 'info',
        timestamp: now,
        read: false
      };

      setNotifications([welcomeNotification, ...medicationNotifications]);
      setHasUnread(true);
      setUnreadCount(welcomeNotification ? medicationNotifications.length + 1 : medicationNotifications.length);
    }
  }, [prescriptions]);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
    setHasUnread(count > 0);
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
    setHasUnread(false);
    setUnreadCount(0);
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );

    // Check if there are any unread notifications left
    const hasAnyUnread = notifications.some(
      notification => notification.id !== id && !notification.read
    );
    setHasUnread(hasAnyUnread);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center"
            >
              <Badge 
                variant="destructive" 
                className="h-5 min-w-5 text-[10px] px-[5px] rounded-full flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Notification panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex gap-2">
                {hasUnread && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications yet
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "border-b border-gray-100 dark:border-gray-800 p-4 relative",
                        !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}