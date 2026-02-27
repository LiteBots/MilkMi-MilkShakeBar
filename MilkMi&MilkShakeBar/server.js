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

// Middleware do parsowania JSON z zapytań
app.use(express.json());

// Udostępnianie plików statycznych z folderu 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// POŁĄCZENIE Z MONGODB (Railway)
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Połączono z bazą MongoDB (Railway)'))
  .catch(err => console.error('❌ Błąd połączenia z MongoDB:', err));

// ==========================================
// ENDPOINTY API
// ==========================================

// Autoryzacja Admina (proste sprawdzanie PINu)
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
    console.log(`🚀 Serwer MilkMi działa pod adresem http://localhost:${PORT}`);
});