import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useLeads } from '../../hooks/useLeads';
import { Lead } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';

interface HeaderProps {
  onNewLeadClick: () => void;
  userName?: string;
  onLogout: () => void;
  onMenuClick: () => void; // Prop para el botón de menú
}

const Header: React.FC<HeaderProps> = ({ onNewLeadClick, userName, onLogout, onMenuClick }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { allLeads, getStageById } = useLeads();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = allLeads.filter(lead =>
        lead.name.toLowerCase().includes(lowerCaseQuery) ||
        lead.company.toLowerCase().includes(lowerCaseQuery)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allLeads]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchFocused(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);


  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/pipeline': return 'Pipeline de Ventas';
      case '/won-leads': return 'Prospectos Ganados';
      case '/leads': return 'Listado de Prospectos';
      case '/users': return 'Administrar Usuarios';
      case '/products': return 'Catálogo de Productos';
      case '/providers': return 'Catálogo de Proveedores';
      case '/stages': return 'Gestionar Etapas';
      default: return 'CRM';
    }
  };

  const firstName = userName ? userName.split(' ')[0] : 'Usuario';
  
  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  return (
    <>
      <header className="flex justify-between items-center h-20 px-4 md:px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
            {/* Botón de Hamburguesa (solo visible en móviles) */}
            <button onClick={onMenuClick} className="md:hidden mr-4 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white truncate">{getTitle()}</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:block relative w-64" ref={searchContainerRef}>
              <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {isSearchFocused && searchQuery && (
                  <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                      {searchResults.length > 0 ? (
                          <ul>
                              {searchResults.map(lead => (
                                  <li 
                                      key={lead.id} 
                                      onClick={() => handleLeadSelect(lead)}
                                      className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                      <p className="font-semibold text-gray-800 dark:text-gray-100">{lead.name}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">{getStageById(lead.status)?.name || lead.status}</p>
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              No se encontraron resultados.
                          </div>
                      )}
                  </div>
              )}
          </div>
          <Button onClick={onNewLeadClick} className="hidden sm:flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Prospecto
          </Button>
          <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2">
                  <span className="hidden sm:inline text-gray-700 dark:text-gray-300">Hola, {firstName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                      <button 
                          onClick={() => {
                              onLogout();
                              setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                          Cerrar Sesión
                      </button>
                  </div>
              )}
          </div>
        </div>
      </header>

      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
};

export default Header;
