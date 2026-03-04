const express = require('express');
const path = require('path');

const app = express();

// Port przypisywany przez Railway lub 3000 lokalnie
const PORT = process.env.PORT || 3000;

// To pozwala serwerowi odczytywać dane JSON wysyłane z frontendu (np. nasz PIN)
app.use(express.json());

// Udostępnianie folderu public i ukrywanie rozszerzeń .html
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

// --- LOGIKA LOGOWANIA DO PANELU ADMINA ---
app.post('/api/admin/login', (req, res) => {
    // Wyciągamy PIN wysłany z formularza na stronie
    const { pin } = req.body;
    
    // Pobieramy PIN ze zmiennych środowiskowych Railway
    const adminPin = process.env.ADMIN1_PIN;

    // Zabezpieczenie na wypadek braku ustawionej zmiennej na Railway
    if (!adminPin) {
        console.error("UWAGA: Brak zmiennej ADMIN1_PIN w konfiguracji serwera!");
        return res.json({ success: false });
    }

    // Weryfikacja
    if (pin === adminPin) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});
// ------------------------------------------

// Fallback dla strony głównej
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Nasłuchiwanie (Zostawiłem '0.0.0.0' - pamiętaj, że to wymóg dla Railway!)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer uruchomiony. Nasłuchuje na porcie: ${PORT}`);
});
