// server.js (fragmenty zmienione)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());

const genAI = new GoogleGenAI({
  // jeśli używasz tylko API Key (Gemini Developer API / AI Studio):
  apiKey: process.env.GEMINI_API_KEY,
  // jeśli używasz Vertex AI, inicjalizuj inaczej (project/location/vertexai: true)
});

app.post('/api/generate', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("ZATRZYMANO: Zmienna GEMINI_API_KEY nie jest ustawiona na serwerze.");
    return res.status(500).json({ error: 'Klucz API Gemini nie jest skonfigurowany na serwerze.' });
  }

  try {
    const { keywords, style } = req.body;

    if (!keywords || !style) {
      console.warn("ZATRZYMANO: Zapytanie nie zawiera 'keywords' lub 'style'.");
      return res.status(400).json({ error: 'Brakujące "keywords" lub "style" w zapytaniu.' });
    }

    const fullPrompt = `Jesteś światowej klasy ekspertem od social media i copywritingu. Twoim zadaniem jest stworzenie angażującego posta na media społecznościowe (np. Instagram, Facebook, LinkedIn).
    
Instrukcje:
1. Użyj podanych słów kluczowych jako głównej inspiracji: "${keywords}".
2. Napisz post w niepowtarzalnym stylu: ${style}.
3. Post powinien być zwięzły, ale chwytliwy.
4. Użyj formatowania Markdown, aby wyróżnić kluczowe frazy. Stosuj **pogrubienie** dla najważniejszych części. Możesz też dodać 2-3 relevantne hashtagi na końcu.
5. Nie dodawaj żadnych wstępów typu "Oto propozycja posta:" ani podpisów. Zwróć tylko i wyłącznie treść posta.
    
Postaraj się, aby efekt był kreatywny i autentyczny dla wybranego stylu.`;

    // ---> POPRAWNE WYWOŁANIE DLA @google/genai
    const resp = await genAI.models.generateContent({
      model: 'gemini-2.5-flash', // lub inny model dostępny w Twoim planie
      contents: [
        { type: 'text', text: fullPrompt }
      ],
      // opcjonalnie: temperature, maxOutputTokens, safetySettings itp.
    });

    // struktura odpowiedzi często: resp.response.candidates[0].content.parts[0].text
    const contentResponse = resp?.response;
    const candidate = contentResponse?.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const text = part?.text ?? '';

    if (!text) {
      console.error("Brak treści w odpowiedzi od GenAI:", JSON.stringify(resp, null, 2));
      return res.status(500).json({ error: 'Brak odpowiedzi tekstowej od API.' });
    }

    res.json({ text });

  } catch (error) {
    console.error("!!! KRYTYCZNY BŁĄD PODCZAS KOMUNIKACJI Z GEMINI API !!!");
    console.error(error);
    let detailedError = (error instanceof Error) ? error.message : String(error);
    res.status(500).json({ error: `Błąd API: ${detailedError}` });
  }
});
