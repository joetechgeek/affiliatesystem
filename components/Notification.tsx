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
    <div 
      className="fixed z-50 top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-md shadow-lg"
      style={{
        animation: 'slideDown 0.5s ease-out',
      }}
    >
      {message}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Notification;
