// server.js
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

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Klucz API Gemini nie jest skonfigurowany na serwerze.' });
  }

  try {
    const { keywords, style } = req.body; 

    if (!keywords || !style) {
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ text });

  } catch (error) {
    // --- OTO ZMIANA ---
    console.error("PEŁNY BŁĄD Z GEMINI:", error); // Loguje pełny błąd w logach Render

    // Spróbuj wyodrębnić bardziej szczegółowy komunikat błędu
    let detailedError = 'Wystąpił nieznany błąd serwera.';
    
    if (error instanceof Error) {
        // 'error.message' często zawiera szczegóły od API Google
        detailedError = error.message;
    }
    
    // Przekaż PRAWDZIWY komunikat błędu do Twojej aplikacji React
    res.status(500).json({ error: detailedError }); 
    // --- KONIEC ZMIANY ---
  }
});

// --- Serwowanie plików statycznych Reacta ---

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
});
```eof

