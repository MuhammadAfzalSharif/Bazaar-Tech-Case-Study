// indentation and code formatting and 
// some help(code correction like syntax 
// problem and some logical problem) is 
// taken from chatgpt 


//here i learn new thing which is express rate limit which
//  is used for to limit user request to route to protect f
// rom DOS attack or botnet attack

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.use(basicAuth({
    users: { 'admin': 'password' },
    challenge: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'inventory'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database', err);
    } else {
        console.log('Connected to MySQL database');
    }
});



app.post('/products', (req, res) => {
    const { id, name, category, quantity, price } = req.body;
    db.query(`INSERT INTO products (id, name, category, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [id, name, category, quantity, price], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, name, category, quantity, price });
        });
});

app.get('/products', (req, res) => {
    db.query(`SELECT * FROM products`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT * FROM products WHERE id = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    });
});

app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, price } = req.body;
    db.query(`UPDATE products SET name = ?, category = ?, quantity = ?, price = ? WHERE id = ?`,
        [name, category, quantity, price, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated successfully' });
        });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM products WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted successfully' });
    });
});

app.post('/stores', (req, res) => {
    const { id, name } = req.body;
    db.query(`INSERT INTO stores (id, name) VALUES (?, ?)`, [id, name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, name });
    });
});

app.put('/stores/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.query(`UPDATE stores SET name = ? WHERE id = ?`, [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Store updated successfully' });
    });
});

app.delete('/stores/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM stores WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Store deleted successfully' });
    });
});

app.get('/available-stocks', (req, res) => {
    db.query(`SELECT * FROM available_stocks`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/sold-items', (req, res) => {
    db.query(`SELECT * FROM sold_items`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
