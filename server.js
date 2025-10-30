// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Basic startup logs so Render/you see the process started
console.log('=== STARTING server.js ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT env var:', process.env.PORT ? 'present' : 'not present');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Global error handlers so the process doesn't exit silently
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — process will not crash silently:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Optional: defensive wrapper if GoogleGenAI construction throws
let genAI;
try {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  console.log('GoogleGenAI client created');
} catch (err) {
  console.error('Błąd podczas inicjalizacji GoogleGenAI:', err);
  // nie exit — zostawimy endpointy działające (zwrócą błąd przy wywołaniu), 
  // ale proces nie powinien przestać działać od razu
}

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

    if (!genAI) {
      console.error('GenAI client nie został poprawnie zainicjalizowany.');
      return res.status(500).json({ error: 'Klient GenAI nie jest dostępny na serwerze.' });
    }

    const resp = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ type: 'text', text: fullPrompt }],
      // opcjonalnie: temperature, maxOutputTokens
    });

    // Bezpieczne parsowanie odpowiedzi
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

// Serwowanie plików statycznych Reacta (jeśli masz)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bind na 0.0.0.0 (Render preferuje, żeby nasłuchiwać na wszystkich interfejsach)
app.listen(port, '0.0.0.0', () => {
  console.log(`Serwer uruchomiony poprawnie na porcie ${port} (binding 0.0.0.0)`);
});

