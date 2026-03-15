const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// IMPORT MODELU Z FOLDERU /models
const Employee = require('./models/Employee'); 

const app = express();

// Port przypisywany przez Railway lub 3000 lokalnie
const PORT = process.env.PORT || 3000;

// --- POŁĄCZENIE Z MONGODB ---
const MONGO_URL = process.env.MONGO_URL;

if (MONGO_URL) {
    mongoose.connect(MONGO_URL)
        .then(() => console.log('Połączono z bazą MongoDB!'))
        .catch(err => console.error('Błąd połączenia z MongoDB:', err));
} else {
    console.warn('UWAGA: Brak zmiennej MONGO_URL. Baza danych nie jest podłączona!');
}

app.use(express.json());

// Udostępnianie folderu public i ukrywanie rozszerzeń .html
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

// --- LOGIKA LOGOWANIA DO PANELU ADMINA ---
app.post('/api/admin/login', async (req, res) => {
    const { pin } = req.body;
    const adminPin = process.env.ADMIN1_PIN;

    // 1. Sprawdzenie "Master PIN" z konfiguracji serwera (główny administrator)
    if (adminPin && pin === adminPin) {
        return res.json({ 
            success: true, 
            message: 'Zalogowano jako Główny Administrator' 
        });
    }

    try {
        // 2. Jeśli to nie Master PIN, szukamy pracownika w bazie danych MongoDB
        const employee = await Employee.findOne({ pin: pin });

        if (employee) {
            // Sukces - znaleziono pracownika z tym kodem PIN
            return res.json({ 
                success: true, 
                message: `Zalogowano pomyślnie: ${employee.name}`,
                role: employee.role,
                name: employee.name
            });
        } else {
            // Błąd - PIN nie pasuje ani do admina, ani do żadnego pracownika
            return res.json({ success: false, error: 'Błędny kod PIN!' });
        }
    } catch (error) {
        console.error('Błąd podczas weryfikacji logowania w bazie:', error);
        return res.status(500).json({ success: false, error: 'Błąd serwera podczas logowania.' });
    }
});

// --- API ZESPOŁU (WORKMI) ---

// Pobieranie listy pracowników
app.get('/api/team', async (req, res) => {
    try {
        // Zwracamy wszystkich pracowników, ale bez pola 'pin' ze względów bezpieczeństwa
        const team = await Employee.find().select('-pin'); 
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Błąd serwera' });
    }
});

// Dodawanie nowego pracownika
app.post('/api/team', async (req, res) => {
    const { name, role, pin } = req.body;

    // Walidacja podstawowa na backendzie
    if (!name || !role || !pin || pin.length !== 5) {
        return res.status(400).json({ success: false, error: 'Błędne dane lub kod PIN nie ma 5 cyfr.' });
    }

    try {
        const newEmployee = new Employee({ name, role, pin });
        await newEmployee.save(); // Zapis do bazy MongoDB
        res.json({ success: true, message: 'Pracownik dodany pomyślnie!' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Błąd podczas zapisu do bazy' });
    }
});

// Fallback dla strony głównej
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Nasłuchiwanie (0.0.0.0 pod Railway)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer uruchomiony na porcie: ${PORT}`);
});
