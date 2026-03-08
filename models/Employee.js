const mongoose = require('mongoose');

// Definiujemy strukturę danych (Schema) dla pracownika
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    pin: { type: String, required: true, minlength: 5, maxlength: 5 }
});

// Eksportujemy model, aby móc go używać w innych plikach (np. w server.js)
module.exports = mongoose.model('Employee', employeeSchema);
