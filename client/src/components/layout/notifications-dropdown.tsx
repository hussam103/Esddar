import React, { useState } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notification } from "@/components/ui/notification";
import { useNotifications } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { ar } from "date-fns/locale";

export default function NotificationsDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    clearAll,
    connected
  } = useNotifications();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  // معالجة النقر على الإشعار
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // إذا كان الإشعار يحتوي على بيانات مناقصة، انتقل إلى صفحة المناقصة
    if (notification.data?.tenderId) {
      setOpen(false);
      setLocation(`/tenders/${notification.data.tenderId}`);
    } 
    // إذا كان الإشعار يحتوي على بيانات طلب، انتقل إلى صفحة تفاصيل الطلب
    else if (notification.data?.applicationId) {
      setOpen(false);
      setLocation(`/applications/${notification.data.applicationId}`);
    }
  };

  // تنسيق وقت الإشعار
  const formatNotificationTime = (timestamp: Date) => {
    return format(new Date(timestamp), "dd MMM, HH:mm", { locale: ar });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] flex items-center justify-center p-0 bg-destructive text-white text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]" dir="rtl">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="text-lg font-bold">الإشعارات</DropdownMenuLabel>
          {connected ? (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">متصل</Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">غير متصل</Badge>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            لا توجد إشعارات
          </div>
        ) : (
          <>
            <DropdownMenuGroup className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-0 focus:bg-transparent"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="w-full cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    <Notification
                      variant={notification.type}
                      title={notification.title}
                      className={`text-right ${!notification.read ? 'bg-muted/50' : ''}`}
                    >
                      <div className="text-sm">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatNotificationTime(notification.timestamp)}
                      </div>
                    </Notification>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <div className="flex justify-between p-2">
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                تحديد الكل كمقروء
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                مسح الكل
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}