
import { GoogleGenAI } from "@google/genai";

// Assume process.env.API_KEY is available in the execution environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real-world scenario, you'd want better error handling or a fallback.
  // For this context, we assume the key is present.
  console.warn("API_KEY is not defined. Using a placeholder. The app will not function correctly without a valid key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generatePost = async (keywords: string, style: string): Promise<string> => {
  try {
    const prompt = `Jesteś światowej klasy ekspertem od social media i copywritingu. Twoim zadaniem jest stworzenie angażującego posta na media społecznościowe (np. Instagram, Facebook, LinkedIn).
    
    Instrukcje:
    1. Użyj podanych słów kluczowych jako głównej inspiracji: "${keywords}".
    2. Napisz post w niepowtarzalnym stylu: ${style}.
    3. Post powinien być zwięzły, ale chwytliwy.
    4. Użyj formatowania Markdown, aby wyróżnić kluczowe frazy. Stosuj **pogrubienie** dla najważniejszych części. Możesz też dodać 2-3 relevantne hashtagi na końcu.
    5. Nie dodawaj żadnych wstępów typu "Oto propozycja posta:" ani podpisów. Zwróć tylko i wyłącznie treść posta.
    
    Postaraj się, aby efekt był kreatywny i autentyczny dla wybranego stylu.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating post with Gemini API:", error);
    throw new Error("Nie udało się wygenerować posta. Sprawdź konsolę, aby uzyskać więcej informacji.");
  }
};
