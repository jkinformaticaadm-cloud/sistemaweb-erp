import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
// Note: In a real production app, ensure the key is present. 
// If not present, the app should gracefully handle it, but for this demo we assume it might exist.
const ai = new GoogleGenAI({ apiKey });

export const analyzeTechnicalIssue = async (device: string, description: string): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API não configurada. Configure process.env.API_KEY para usar a IA.";
  }

  try {
    const prompt = `
      Atue como um técnico especialista em reparo de eletrônicos.
      Dispositivo: ${device}
      Problema relatado pelo cliente: ${description}

      Forneça uma análise técnica concisa contendo:
      1. Possíveis causas (liste 3).
      2. Procedimento de diagnóstico sugerido.
      3. Estimativa de complexidade (Baixa/Média/Alta).
      
      Mantenha a resposta direta e profissional, em português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar um diagnóstico.";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Erro ao comunicar com a Inteligência Artificial. Verifique a conexão.";
  }
};