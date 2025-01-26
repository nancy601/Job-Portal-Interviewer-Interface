import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: number;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom hook to use the Toast context
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant }]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

// ToastContainer component
export const ToastContainer: React.FC = () => {
  const { toasts } = useToastContext();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`mb-2 p-4 rounded-md shadow-md ${
            toast.variant === 'destructive' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          <h3 className="font-bold">{toast.title}</h3>
          <p>{toast.description}</p>
        </div>
      ))}
    </div>
  );
};
