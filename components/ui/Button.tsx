import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // --- CAMBIO #1: Se añaden las nuevas variantes ---
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {

  const baseClasses = "flex justify-center items-center rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors";

  // --- CAMBIO #2: Se definen los estilos para las nuevas variantes ---
  const variantClasses = {
    primary: "text-white bg-sky-950 hover:bg-sky-800 focus:ring-sky-700 border-transparent",
    secondary: "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border-transparent",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border-transparent",
    icon: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-sky-500 border-transparent p-2", // Estilo minimalista para íconos
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  // Si la variante es 'icon', no aplicamos las clases de tamaño estándar
  const finalSizeClasses = variant === 'icon' ? '' : sizeClasses[size];

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${finalSizeClasses} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
