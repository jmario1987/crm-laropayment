import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {

  const baseClasses = "flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";

  // Hemos cambiado 'blue' por 'sky-950' y ajustado los colores relacionados
  const variantClasses = {
    primary: "text-white bg-sky-950 hover:bg-sky-800 focus:ring-sky-700",
    secondary: "text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-sky-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;