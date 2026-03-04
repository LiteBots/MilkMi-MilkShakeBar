const express = require('express');
const path = require('path');

const app = express();

// Railway dynamicznie przypisuje port przez zmienną process.env.PORT
// Jeśli uruchamiasz to lokalnie, użyje portu 3000
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Udostępnianie folderu public i ukrywanie rozszerzeń .html
// Dzięki temu wejście na /app automatycznie zaserwuje app.html
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

// Fallback dla strony głównej (choć express.static załatwi index.html automatycznie)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Nasłuchiwanie
app.listen(PORT, () => {
    console.log(`Serwer uruchomiony. Nasłuchuje na porcie: ${PORT}`);
});
