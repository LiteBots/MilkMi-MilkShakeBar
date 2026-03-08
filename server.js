const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Dodano Mongoose

const app = express();

// Port przypisywany przez Railway lub 3000 lokalnie
const PORT = process.env.PORT || 3000;

// --- POŁĄCZENIE Z MONGODB ---
// Pobieramy link do bazy ze zmiennych środowiskowych
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Połączono z bazą MongoDB!'))
        .catch(err => console.error('Błąd połączenia z MongoDB:', err));
} else {
    console.warn('UWAGA: Brak zmiennej MONGODB_URI. Baza danych nie jest podłączona!');
}

// --- MODELE DANYCH ---
// Model Pracownika
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    pin: { type: String, required: true, minlength: 5, maxlength: 5 }
});
const Employee = mongoose.model('Employee', employeeSchema);

app.use(express.json());

// Udostępnianie folderu public i ukrywanie rozszerzeń .html
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

// --- LOGIKA LOGOWANIA DO PANELU ADMINA ---
app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body;
    const adminPin = process.env.ADMIN1_PIN;

    if (!adminPin) {
        console.error("UWAGA: Brak zmiennej ADMIN1_PIN w konfiguracji serwera!");
        return res.json({ success: false });
    }

    if (pin === adminPin) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// --- API ZESPOŁU (WORKMI) ---
// Pobieranie listy pracowników
app.get('/api/team', async (req, res) => {
    try {
        // Wyciągamy wszystkich z bazy (bez wysyłania kodów PIN na frontend ze względów bezpieczeństwa)
        const team = await Employee.find().select('-pin'); 
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Błąd serwera' });
    }
});

// Dodawanie nowego pracownika
app.post('/api/team', async (req, res) => {
    const { name, role, pin } = req.body;

    if (!name || !role || !pin || pin.length !== 5) {
        return res.status(400).json({ success: false, error: 'Błędne dane lub kod PIN nie ma 5 cyfr.' });
    }

    try {
        const newEmployee = new Employee({ name, role, pin });
        await newEmployee.save(); // Zapis do bazy
        res.json({ success: true, message: 'Pracownik dodany pomyślnie!' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Błąd podczas zapisu do bazy' });
    }
});

// Fallback dla strony głównej
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Nasłuchiwanie
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer uruchomiony. Nasłuchuje na porcie: ${PORT}`);
});
