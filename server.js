// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/genai';
import 'dotenv/config'; // Załaduj zmienne środowiskowe

// Konfiguracja dla modułów ES (aby działało __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001; // Render ustawi PORT automatycznie

// --- 1. Bezpieczne API Proxy dla Gemini ---

app.use(express.json()); // Pozwól serwerowi czytać JSON z body zapytania

// Pobierz klucz API ze zmiennych środowiskowych
// UWAGA: Na Renderze musisz ustawić zmienną środowiskową o nazwie GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Klucz API Gemini nie jest skonfigurowany na serwerze.' });
  }

  try {
    const { prompt } = req.body; // Odbierz prompt od klienta

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Możesz zmienić model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ text }); // Odeślij odpowiedź do klienta

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd podczas komunikacji z Gemini API' });
  }
});

// --- 2. Serwowanie plików statycznych Reacta ---

// Ustaw ścieżkę do zbudowanych plików Reacta (folder 'dist')
app.use(express.static(path.join(__dirname, 'dist')));

// Dla wszystkich innych zapytań odeślij główny plik index.html
// To pozwala React Routerowi (jeśli go używasz) przejąć kontrolę
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(port, () => {
  console.log(`Serwer uruchomiony na porcie ${port}`);
});
