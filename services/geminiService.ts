import { GoogleGenerativeAI, Content } from "@google/genai"; // Importamos más tipos
import { Lead } from '../types';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.warn("La clave de API de Gemini no está configurada. Las funciones de IA estarán deshabilitadas.");
}

// Renombramos la variable para evitar conflictos
const genAI = new GoogleGenerativeAI(apiKey!);

export const generateFollowUpEmail = async (lead: Lead): Promise<string> => {
  if (!apiKey) {
    return Promise.resolve("Estimado/a [Nombre del Prospecto],\n\nEspero que se encuentre bien. Quería hacer un seguimiento de nuestra conversación anterior sobre [Tema].\n\n¿Tendría un momento esta semana para conversar?\n\nSaludos cordiales,\n[Tu Nombre]");
  }
  
  const prompt = `
    Eres un asistente de ventas experto. Tu tarea es escribir un correo electrónico de seguimiento profesional y conciso para un prospecto.
    
    Información del Prospecto:
    - Nombre: ${lead.name}
    - Empresa: ${lead.company}
    - Estado Actual en el Pipeline: ${lead.status ?? 'No definido'}

    Instrucciones:
    1.  El tono debe ser amigable pero profesional.
    2.  El correo debe ser breve y directo.
    3.  El objetivo es reanudar la conversación y mover al prospecto al siguiente paso.
    4.  Personaliza el mensaje basado en su estado actual. Por ejemplo, si el estado es 'Contactado', el correo podría ser para agendar una reunión. Si es 'Propuesta Enviada', podría ser para preguntar si tienen alguna duda sobre la propuesta.
    5.  No incluyas un asunto, solo el cuerpo del correo.
    6.  Usa placeholders como "[Tu Nombre]" para que el usuario pueda personalizarlo.
    7.  El correo debe estar en español.
  `;

  try {
    // CORRECCIÓN FINAL: Usamos la estructura que la librería espera
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error al generar el correo con Gemini:", error);
    throw new Error("No se pudo generar el contenido del correo electrónico.");
  }
};
