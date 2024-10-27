import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center transform transition-transform duration-300 ease-in-out" style={{
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    }}>
      {message}
    </div>
  );
};

export default Notification;
