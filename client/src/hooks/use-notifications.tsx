import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// تعريف أنواع الإشعارات
export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  connected: boolean;
  sendTestNotification: (title: string, message: string, type: NotificationType) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // إعداد اتصال WebSocket عندما يكون المستخدم مسجلاً
  useEffect(() => {
    if (!user) {
      // إغلاق الاتصال إذا كان المستخدم غير مسجل
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // إنشاء اتصال WebSocket إذا لم يكن موجوداً
    if (!socketRef.current) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      socketRef.current = new WebSocket(wsUrl);
      
      // معالجة فتح الاتصال
      socketRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
        
        // إرسال رسالة المصادقة بمعرف المستخدم
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }
      };
      
      // معالجة استلام الرسائل
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // تحقق من نوع الرسالة
          if (data.type === 'notification') {
            // إضافة إشعار جديد
            const newNotification: Notification = {
              id: crypto.randomUUID(),
              title: data.title,
              message: data.message,
              type: data.notificationType || 'info',
              timestamp: new Date(data.timestamp),
              read: false,
              data: data.data
            };
            
            // تحديث قائمة الإشعارات
            setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // الاحتفاظ بأحدث 50 إشعار
            
            // عرض الإشعار كـ toast
            toast({
              title: data.title,
              description: data.message,
              variant: data.notificationType === 'error' ? 'destructive' : 'default',
            });
          } else if (data.type === 'auth_success') {
            console.log("Authentication success:", data.message);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
      
      // معالجة الأخطاء
      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };
      
      // معالجة إغلاق الاتصال
      socketRef.current.onclose = () => {
        console.log("WebSocket closed");
        setConnected(false);
        socketRef.current = null;
        
        // إعادة الاتصال بعد فترة قصيرة
        setTimeout(() => {
          if (user) {
            // محاولة إعادة الاتصال فقط إذا كان المستخدم ما زال مسجلاً
            socketRef.current = null; // تأكد من أن المرجع فارغ للسماح بإعادة الاتصال في المرة القادمة
          }
        }, 5000);
      };
    }
    
    // تنظيف عند تفكيك المكون
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, toast]);

  // حساب عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => !n.read).length;

  // تحديد إشعار كمقروء
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // مسح جميع الإشعارات
  const clearAll = () => {
    setNotifications([]);
  };

  // إرسال إشعار اختباري
  const sendTestNotification = async (title: string, message: string, type: NotificationType = 'info') => {
    try {
      const response = await fetch('/api/send-test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        connected,
        sendTestNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}