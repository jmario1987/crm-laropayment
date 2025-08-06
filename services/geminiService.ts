import { GoogleGenAI } from "@google/genai";
import { Lead } from '../types';

// Se cambia 'process.env.API_KEY' por 'import.meta.env.VITE_API_KEY'
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.warn("La clave de API de Gemini no está configurada. Las funciones de IA estarán deshabilitadas.");
}

// Usamos la nueva variable 'apiKey' que es más segura
const ai = new GoogleGenAI({ apiKey: apiKey! });

export const generateFollowUpEmail = async (lead: Lead): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("Estimado/a [Nombre del Prospecto],\n\nEspero que se encuentre bien. Quería hacer un seguimiento de nuestra conversación anterior sobre [Tema].\n\n¿Tendría un momento esta semana para conversar?\n\nSaludos cordiales,\n[Tu Nombre]");
  }
  
  const prompt = `
    Eres un asistente de ventas experto. Tu tarea es escribir un correo electrónico de seguimiento profesional y conciso para un prospecto.
    
    Información del Prospecto:
    - Nombre: ${lead.name}
    - Empresa: ${lead.company}
    - Estado Actual en el Pipeline: ${lead.status}

    Instrucciones:
    1.  El tono debe ser amigable pero profesional.
    2.  El correo debe ser breve y directo.
    3.  El objetivo es reanudar la conversación y mover al prospecto al siguiente paso.
    4.  Personaliza el mensaje basado en su estado actual. Por ejemplo, si el estado es 'Contactado', el correo podría ser para agendar una reunión. Si es 'Propuesta Enviada', podría ser para preguntar si tienen alguna duda sobre la propuesta.
    5.  No incluyas un asunto, solo el cuerpo del correo.
    6.  Usa placeholders como "[Tu Nombre]" para que el usuario pueda personalizarlo.
    7.  El correo debe estar en español.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error al generar el correo con Gemini:", error);
    throw new Error("No se pudo generar el contenido del correo electrónico.");
  }
};
