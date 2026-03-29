import React from 'react';

interface StatCardProps {
  title: string;
  // 1. Ahora acepta nuestro componente de monedas o texto normal
  value: string | React.ReactNode; 
  // 2. Agregamos 'star' a la lista permitida
  icon: 'users' | 'trophy' | 'trendingUp' | 'trendingDown' | 'star';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
    const iconPaths = {
        users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
        trophy: "M12 2L9 8.5 2 9.25l5.5 5.05L6 21l6-3.5 6 3.5-1.5-6.7L22 9.25l-7-.75L12 2z",
        trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
        trendingDown: "M23 18l-9.5-9.5-5 5L1 6",
        // 3. Agregamos el path para la estrella
        star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
    };

    const iconColors = {
        users: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        trophy: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
        trendingUp: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        trendingDown: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        // 4. Un color púrpura/índigo para destacar las ganancias de Laro
        star: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", 
    }
  
    return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full ${iconColors[icon]} mr-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {icon === 'users' && <><path d={iconPaths.users}/><circle cx="9" cy="7" r="4"/></>}
                {icon !== 'users' && <path d={iconPaths[icon]}/>}
            </svg>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            {/* 5. Cambiamos <p> por <div> para evitar errores de renderizado en React */}
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
    </div>
  );
};

export default StatCard;