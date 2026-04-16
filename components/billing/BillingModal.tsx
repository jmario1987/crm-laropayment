import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// --- NUEVA LÓGICA: TODOS LOS MESES DESDE SEPTIEMBRE 2025 HASTA HOY ---
const getAvailableMonths = () => {
    const options = [];
    let date = new Date();
    date.setDate(15); 
    
    const targetYear = 2025;
    const targetMonthIndex = 8; // Mes 8 en JavaScript es Septiembre

    while (date.getFullYear() > targetYear || (date.getFullYear() === targetYear && date.getMonth() >= targetMonthIndex)) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        options.push(`${month}-${year}`);
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

// --- MINI COMPONENTE PARA FORMATEAR MILES CON COMAS ---
const CurrencyInput: React.FC<{
    value: number;
    onChange: (val: number) => void;
    prefix: string;
    placeholder: string;
}> = ({ value, onChange, prefix, placeholder }) => {
    const [localValue, setLocalValue] = useState(value ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '');

    // Sincroniza si el valor cambia desde afuera (ej. al abrir el modal)
    useEffect(() => {
        const numericLocal = parseFloat(localValue.replace(/,/g, '')) || 0;
        if (value !== numericLocal) {
            setLocalValue(value ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permite números y un punto decimal
        let val = e.target.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts[1]; 
        
        let formatted = val;
        if (parts[0]) {
            // Agrega las comas de miles
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            formatted = parts.join('.');
        }

        setLocalValue(formatted);
        onChange(parseFloat(val) || 0); // Envía el número limpio a la base de datos
    };

    return (
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-bold">{prefix}</span>
            </div>
            <input
                type="text"
                value={localValue}
                onChange={handleChange}
                className="block w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-colors"
                placeholder={placeholder}
            />
        </div>
    );
};

interface BillingModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<Lead>) => void;
}

type MontosMoneda = { montoCRC: number, comisionCRC: number, montoUSD: number, comisionUSD: number };

const BillingModal: React.FC<BillingModalProps> = ({ lead, isOpen, onClose, onSave }) => {
  const [history, setHistory] = useState<{ [key: string]: boolean }>({});
  const [amounts, setAmounts] = useState<{ [key: string]: MontosMoneda }>({});
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  useEffect(() => {
    if (isOpen) {
      setHistory(lead.billingHistory || {});
      setAmounts(lead.billingAmounts || {});
      setStatus(lead.clientStatus || 'Activo');
    }
  }, [isOpen, lead]);

  const monthsToDisplay = getAvailableMonths();

  const handleToggle = (monthYear: string) => {
    setHistory(prev => {
        const newState = !prev[monthYear];
        
        if (!newState) {
            setAmounts(prevAmounts => {
                const newAmounts = { ...prevAmounts };
                delete newAmounts[monthYear];
                return newAmounts;
            });
        } else {
            setAmounts(prevAmounts => ({
                ...prevAmounts,
                [monthYear]: prevAmounts[monthYear] || { montoCRC: 0, comisionCRC: 0, montoUSD: 0, comisionUSD: 0 }
            }));
        }
        
        return {
            ...prev,
            [monthYear]: newState,
        };
    });
  };

  const handleAmountChange = (monthYear: string, field: 'montoCRC' | 'montoUSD', numericValue: number) => {
      setAmounts(prev => ({
          ...prev,
          [monthYear]: {
              ...(prev[monthYear] || { montoCRC: 0, comisionCRC: 0, montoUSD: 0, comisionUSD: 0 }),
              [field]: numericValue
          }
      }));
  };

  const handleSave = () => {
    const updatedData: Partial<Lead> = {
      billingHistory: history,
      billingAmounts: amounts,
      clientStatus: status,
      lastUpdate: new Date().toISOString(), 
    };
    onSave(updatedData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Conciliación: ${lead.name}`}>
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Historial Mensual</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Activa el interruptor y digita el monto base facturado por el cliente.
          </p>
          <div className="space-y-2">
            {monthsToDisplay.map(monthYear => (
              <div key={monthYear} className="flex flex-col sm:flex-row sm:items-center bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 gap-3">
                
                {/* MES Y SWITCH */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:min-w-[140px]">
                    <span className="font-bold text-gray-800 dark:text-white text-sm">{monthYear}</span>
                    <button
                        onClick={() => handleToggle(monthYear)}
                        className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${history[monthYear] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${history[monthYear] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
                
                {/* CAMPOS DE DINERO COMPACTOS (HORIZONTAL) */}
                {history[monthYear] && (
                    <div className="flex-1 flex gap-3 w-full animate-fadeIn">
                        <div className="w-full">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 font-bold uppercase tracking-wider">Base (CRC)</div>
                            <CurrencyInput 
                                prefix="₡" 
                                placeholder="0" 
                                value={amounts[monthYear]?.montoCRC || 0} 
                                onChange={(val) => handleAmountChange(monthYear, 'montoCRC', val)} 
                            />
                        </div>
                        <div className="w-full">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 font-bold uppercase tracking-wider">Base (USD)</div>
                            <CurrencyInput 
                                prefix="$" 
                                placeholder="0.00" 
                                value={amounts[monthYear]?.montoUSD || 0} 
                                onChange={(val) => handleAmountChange(monthYear, 'montoUSD', val)} 
                            />
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b pb-1 dark:border-gray-700">Estado Operativo</h4>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                    Actualmente: <span className={status === 'Activo' ? 'text-green-600 font-bold ml-1' : 'text-red-500 font-bold ml-1'}>{status}</span>
                </span>
                <Button 
                    variant={status === 'Activo' ? 'danger' : 'secondary'}
                    onClick={() => setStatus(status === 'Activo' ? 'Inactivo' : 'Activo')}
                >
                   {status === 'Activo' ? 'Marcar como Inactivo' : 'Reactivar'}
                </Button>
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
          <Button variant="secondary" onClick={onClose} className="px-5">Cancelar</Button>
          <Button onClick={handleSave} className="px-6 bg-primary-600 hover:bg-primary-700 text-white shadow-sm">Guardar Historial</Button>
        </div>
      </div>
    </Modal>
  );
};

export default BillingModal;