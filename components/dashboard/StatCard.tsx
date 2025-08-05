
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: 'users' | 'trophy' | 'trendingUp' | 'trendingDown';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
    const iconPaths = {
        users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
        trophy: "M12 2L9 8.5 2 9.25l5.5 5.05L6 21l6-3.5 6 3.5-1.5-6.7L22 9.25l-7-.75L12 2z",
        trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
        trendingDown: "M23 18l-9.5-9.5-5 5L1 6"
    };

    const iconColors = {
        users: "bg-blue-100 text-blue-600",
        trophy: "bg-yellow-100 text-yellow-600",
        trendingUp: "bg-green-100 text-green-600",
        trendingDown: "bg-red-100 text-red-600",
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
  );
};

export default StatCard;
