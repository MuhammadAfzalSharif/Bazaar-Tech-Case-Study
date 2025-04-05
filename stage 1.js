// indentation and code formatting  and some help
//  (code correction like syntax problem and some 
// logical problem) is taken from chatgpt 

//used filing system to store data in flat files
//  instead database and perform CRUD operations on it

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
app.use(bodyParser.json());

const productsPath = path.join(__dirname, 'data/products.json');
const availableStocksPath = path.join(__dirname, 'data/availableStocks.json');
const soldItemsPath = path.join(__dirname, 'data/soldItems.json');

const readData = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
};

const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = () => Date.now().toString();

app.post('/products', (req, res) => {
    const { name, category, quantity, price } = req.body;
    const id = generateId();

    const newProduct = { id, name, category, quantity, price };

    const products = readData(productsPath);
    const stocks = readData(availableStocksPath);

    products.push(newProduct);
    stocks.push({ ...newProduct });

    writeData(productsPath, products);
    writeData(availableStocksPath, stocks);

    res.status(201).json(newProduct);
});

app.get('/products', (req, res) => {
    const products = readData(productsPath);
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const products = readData(productsPath);
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, price } = req.body;

    let products = readData(productsPath);
    let stocks = readData(availableStocksPath);

    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });

    const updatedProduct = { id, name, category, quantity, price };
    products[index] = updatedProduct;

    const stockIndex = stocks.findIndex(s => s.id === id);
    if (stockIndex !== -1) stocks[stockIndex] = { ...updatedProduct };

    writeData(productsPath, products);
    writeData(availableStocksPath, stocks);

    res.json({ message: 'Product updated successfully' });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;

    let products = readData(productsPath);
    let stocks = readData(availableStocksPath);
    let sold = readData(soldItemsPath);

    products = products.filter(p => p.id !== id);
    stocks = stocks.filter(s => s.id !== id);
    sold = sold.filter(s => s.id !== id);

    writeData(productsPath, products);
    writeData(availableStocksPath, stocks);
    writeData(soldItemsPath, sold);

    res.json({ message: 'Product deleted successfully' });
});

app.get('/available-stocks', (req, res) => {
    const stocks = readData(availableStocksPath);
    res.json(stocks);
});

app.get('/sold-items', (req, res) => {
    const sold = readData(soldItemsPath);
    res.json(sold);
});

app.listen(PORT, () => {
    console.log(`Server running `);
});
