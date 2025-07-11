import { useState } from 'react';
import { DraggablePanel } from '../UI/DraggablePanel';
import { useToast } from '@/components/ui/use-toast';
import { Bell } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const { toast } = useToast();

  const addNotification = (msg) => {
    setNotifications([...notifications, msg]);
    toast({ description: msg });
  };

  return (
    <DraggablePanel>
      <Bell className="cursor-pointer" onClick={() => addNotification('Test notification')} />
      <div className="overflow-y-auto max-h-64">
        {notifications.map((n, i) => <div key={i}>{n}</div>)}
      </div>
    </DraggablePanel>
  );
} 