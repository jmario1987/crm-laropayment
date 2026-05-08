import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useLeads } from '../../hooks/useLeads';
import { Lead, USER_ROLES } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';
import Notifications from '../notifications/Notifications';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onNewLeadClick: () => void;
  userName?: string;
  onLogout: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewLeadClick, userName, onLogout, onMenuClick }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { allLeads, getStageById, dispatch } = useLeads();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchResults, setSearchResults] = useState<{lead: Lead, matchReason?: string}[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const results: {lead: Lead, matchReason?: string}[] = [];

      allLeads.forEach(lead => {
          let isMatch = false;
          let matchReason = '';

          // 1. Búsqueda Clásica
          if ((lead.name?.toLowerCase() || '').includes(lowerCaseQuery)) { isMatch = true; }
          else if ((lead.company?.toLowerCase() || '').includes(lowerCaseQuery)) { isMatch = true; }
          else if ((lead.email?.toLowerCase() || '').includes(lowerCaseQuery)) { isMatch = true; }
          else if ((lead.phone?.toLowerCase() || '').includes(lowerCaseQuery)) { isMatch = true; }
          else if ((lead.affiliateNumber?.toLowerCase() || '').includes(lowerCaseQuery)) { 
              isMatch = true; 
          }
          
          // 2. Búsqueda Profunda (Placas y Terminales)
          if (!isMatch && lead.equipments && lead.equipments.length > 0) {
              for (const eq of lead.equipments) {
                  if (eq.placa.toLowerCase().includes(lowerCaseQuery)) {
                      isMatch = true;
                      matchReason = `Placa: ${eq.placa}`;
                      break; 
                  }
                  if (eq.terminals && eq.terminals.length > 0) {
                      const matchedTerminal = eq.terminals.find(t => t.number.toLowerCase().includes(lowerCaseQuery));
                      if (matchedTerminal) {
                          isMatch = true;
                          matchReason = `Terminal: ${matchedTerminal.number}`;
                          break;
                      }
                  }
              }
          }

          if (isMatch) {
              results.push({ lead, matchReason });
          }
      });

      setSearchResults(results);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/pipeline': return 'Pipeline de Ventas';
      case '/won-leads': return 'Clientes en Producción';
      case '/leads': return 'Directorio';
      case '/reports': return 'Centro de Reportes';
      case '/users': return 'Administrar Usuarios';
      case '/products': return 'Catálogo de Productos';
      case '/providers': return 'Catálogo de Desarrolladores';
      case '/stages': return 'Gestionar Etapas';
      case '/tags': return 'Sub Etapas';
      case '/auditpage': return 'Bitácora de Cambios';
      default: return 'CRM LAROPAYMENTS';
    }
  };

  const firstName = userName ? userName.split(' ')[0] : 'Usuario';
  
  const handleLeadSelect = (lead: Lead) => {
    if (user?.role === USER_ROLES.Vendedor && lead.notificationForSeller) {
      const updatedLead = { ...lead, notificationForSeller: false };
      dispatch({ type: 'UPDATE_LEAD', payload: updatedLead });
    }
    if ((user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor) && lead.sellerHasViewedNotification) {
      const updatedLead = { ...lead, sellerHasViewedNotification: false, notificationForManagerId: '' };
      dispatch({ type: 'UPDATE_LEAD', payload: updatedLead });
    }

    setSelectedLead(lead);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  return (
    <>
      <header className="flex justify-between items-center h-20 px-4 md:px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
            <button onClick={onMenuClick} className="md:hidden mr-4 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white truncate">{getTitle()}</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:block relative w-80" ref={searchContainerRef}> {/* Aumenté el ancho del buscador a w-80 para mayor comodidad */}
              <input
                  type="text"
                  placeholder="Buscar prospecto, placa o terminal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {isSearchFocused && searchQuery && (
                  <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto border border-gray-100 dark:border-gray-700">
                      {searchResults.length > 0 ? (
                          <ul>
                              {searchResults.map(({lead, matchReason}) => (
                                  <li 
                                      key={lead.id} 
                                      onClick={() => handleLeadSelect(lead)}
                                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
                                  >
                                      {/* Contenedor principal alineado arriba con espacio (gap) */}
                                      <div className="flex justify-between items-start gap-3">
                                        
                                        {/* El nombre ahora tiene 'line-clamp-2' para ocupar hasta 2 líneas sin cortarse drásticamente */}
                                        <p 
                                            className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug line-clamp-2"
                                            title={lead.name}
                                        >
                                            {lead.name}
                                        </p>
                                        
                                        {/* ETIQUETAS VISUALES (Ahora muestra ambas: Motivo y Afiliado) */}
                                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                            {matchReason && (
                                                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 rounded shadow-sm border border-green-200 whitespace-nowrap">
                                                    {matchReason}
                                                </span>
                                            )}
                                            {lead.affiliateNumber && (
                                                <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-blue-100 text-blue-800 rounded shadow-sm border border-blue-200 whitespace-nowrap">
                                                    Af: {lead.affiliateNumber}
                                                </span>
                                            )}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{lead.company || lead.email}</p>
                                          <p className="text-[10px] font-medium text-gray-400 uppercase">{getStageById(lead.status)?.name || lead.status}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <div className="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                              No se encontraron resultados para "<span className="font-semibold">{searchQuery}</span>".
                          </div>
                      )}
                  </div>
              )}
          </div>
          
          <Button onClick={onNewLeadClick} className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Prospecto
          </Button>
          
          <Notifications onLeadSelect={handleLeadSelect} />

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