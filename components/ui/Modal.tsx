import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // NUEVO: Permite personalizar el ancho cuando lo necesites
  maxWidth?: string; 
}

// Cambiamos el valor por defecto de max-w-lg a max-w-4xl
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        // Inyectamos el maxWidth dinámico y controlamos la altura máxima (max-h)
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[95vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- CABECERA FIJA --- */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/80 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {/* --- CONTENIDO SCROLLABLE --- */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;