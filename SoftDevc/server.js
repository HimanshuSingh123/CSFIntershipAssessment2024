const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3200;
const API_KEY = process.env.API_KEY; // secure API storage in .env file for security assessment, but 69f6d321dab5f4e704eca7db24403883 is the key.

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE form_data (id INTEGER PRIMARY KEY AUTOINCREMENT, city TEXT, date TEXT, temperature TEXT)");
});

app.post('/', (req, res) => {
    const { city, date } = req.body;

    if (!city || !date) {
        return res.status(400).json({ error: 'City and date are required' });
    }

    axios.get(`http://api.weatherstack.com/current?access_key=${API_KEY}&query=${city}`)
        .then(response => {
            const temperature = response.data.current.temperature;

            db.run(`INSERT INTO form_data (city, date, temperature) VALUES (?, ?, ?)`, [city, date, temperature], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID });
            });
        })
        .catch(error => {
            res.status(500).json({ error: 'Error fetching data from Weatherstack API' });
        });
});

app.get('/responses', (req, res) => {
    console.log("GET /responses request received");
    db.all(`SELECT * FROM form_data`, [], (err, rows) => {
        if (err) {
            console.error("Error fetching data from database:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("Data fetched from database:", rows);
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});