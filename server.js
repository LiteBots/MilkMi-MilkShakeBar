require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware do parsowania JSON z zapytań (potrzebne do logowania PIN-em)
app.use(express.json());

// Udostępnianie plików statycznych z folderu 'public' (CSS, obrazki itp.)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// POŁĄCZENIE Z MONGODB (Railway)
// ==========================================
// Upewnij się, że w pliku .env masz zmienną MONGO_URI
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ Połączono z bazą MongoDB'))
      .catch(err => console.error('❌ Błąd połączenia z MongoDB:', err));
} else {
    console.warn('⚠️ Brak MONGO_URI w pliku .env. Baza danych nie jest podłączona.');
}

// ==========================================
// ROUTING (Strony HTML)
// ==========================================

// Strona główna
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Aplikacja PWA
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Panel Administratora (Twój wymóg)
app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==========================================
// ENDPOINTY API
// ==========================================

// Autoryzacja Admina (sprawdzanie PINu)
app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body;
    
    // Sprawdzamy czy PIN z frontendu zgadza się z tym w pliku .env (ADMIN_USERS)
    if (pin && pin === process.env.ADMIN_USERS) {
        res.json({ success: true, message: "Zalogowano pomyślnie" });
    } else {
        res.status(401).json({ success: false, message: "Nieprawidłowy kod PIN" });
    }
});

// Endpoint symulujący pobieranie danych na front (Happy Bar, etc.)
app.get('/api/data', (req, res) => {
    res.json({ happy: "Dziś darmowa dostawa z kodem MILK26!" });
});

// ==========================================
// SOCKET.IO (Komunikacja w czasie rzeczywistym)
// ==========================================
io.on('connection', (socket) => {
    console.log(`🔌 Nowy klient połączony: ${socket.id}`);

    // Kiedy admin wyśle aktualizację Happy Bar
    socket.on('update-happy-bar', (newText) => {
        // Rozsyłamy to do WSZYSTKICH podłączonych klientów (aplikacja i strona główna)
        io.emit('happy-updated', newText);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Klient rozłączony: ${socket.id}`);
    });
});

// ==========================================
// START SERWERA
// ==========================================
server.listen(PORT, () => {
    console.log(`🚀 Serwer działa!`);
    console.log(`👉 Strona główna: http://localhost:${PORT}`);
    console.log(`👉 Aplikacja PWA: http://localhost:${PORT}/app`);
    console.log(`👉 Panel Admina:  http://localhost:${PORT}/manage`);
});
