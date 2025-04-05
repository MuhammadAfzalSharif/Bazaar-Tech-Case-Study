// indentation and code formatting  and some help 
// (code correction like syntax problem and some 
// logical problem) is taken from chatgpt 


// learning :redis ,caching and first time implement a
//  log action function to log the action in the database

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const rateLimit = require('express-rate-limit');
const redis = require('redis');

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

// i am using redis for caching and i am using redis client to connect to redis server
// caching is used to store frequently accessed data in memory to reduce database load and improve performance
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

const cache = (key, data, ttl = 3600) => {
    redisClient.setex(key, ttl, JSON.stringify(data), (err) => {
        if (err) console.error('Redis setex error:', err);
    });
};

const getFromCache = (key) => {
    return new Promise((resolve, reject) => {
        redisClient.get(key, (err, data) => {
            if (err) {
                console.error('Redis get error:', err);
                reject(err);
            } else {
                resolve(data ? JSON.parse(data) : null);
            }
        });
    });
};

const clearCache = (pattern) => {
    redisClient.keys(pattern, (err, keys) => {
        if (err) return console.error('Redis keys error:', err);
        if (keys.length) {
            redisClient.del(keys, (err) => {
                if (err) console.error('Redis del error:', err);
            });
        }
    });
};

const logAction = (action, details) => {
    db.query(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [action, details], (err) => {
        if (err) console.error('Error logging action:', err);
    });
};

// Product Routes

app.post('/products', (req, res) => {
    const { id, name, category, quantity, price } = req.body;
    db.query(`INSERT INTO products (id, name, category, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [id, name, category, quantity, price], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            // log transaction the database
            logAction('CREATE_PRODUCT', JSON.stringify(req.body));
            res.status(201).json({ id, name, category, quantity, price });
        });
});

app.get('/products', async (req, res) => {
    const cacheKey = 'products:all';

    try {
        // check if data is in cache
        const cachedData = await getFromCache(cacheKey);
        if (cachedData) {
            logAction('READ_PRODUCTS_FROM_CACHE', 'Fetched all products from cache');
            return res.json(cachedData);
        }

        db.query(`SELECT * FROM products`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            // cache the data
            cache(cacheKey, rows);
            logAction('READ_PRODUCTS_FROM_DB', 'Fetched all products from DB');
            res.json(rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `products:${id}`;

    try {
        const cachedData = await getFromCache(cacheKey);
        if (cachedData) {
            logAction('READ_PRODUCT_FROM_CACHE', `Fetched product ${id} from cache`);
            return res.json(cachedData);
        }

        db.query(`SELECT * FROM products WHERE id = ?`, [id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
            cache(cacheKey, rows[0]);
            logAction('READ_PRODUCT_FROM_DB', `Fetched product ${id} from DB`);
            res.json(rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, price } = req.body;
    db.query(`UPDATE products SET name = ?, category = ?, quantity = ?, price = ? WHERE id = ?`,
        [name, category, quantity, price, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            clearCache(`products:${id}`);
            clearCache('products:all');
            logAction('UPDATE_PRODUCT', JSON.stringify({ id, name, category, quantity, price }));
            res.json({ message: 'Product updated successfully' });
        });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM products WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        clearCache(`products:${id}`);
        clearCache('products:all');
        logAction('DELETE_PRODUCT', `Deleted product with id ${id}`);
        res.json({ message: 'Product deleted successfully' });
    });
});

// Store Routes

app.post('/stores', (req, res) => {
    const { id, name } = req.body;
    db.query(`INSERT INTO stores (id, name) VALUES (?, ?)`, [id, name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        clearCache('stores:*');
        logAction('CREATE_STORE', JSON.stringify({ id, name }));
        res.status(201).json({ id, name });
    });
});

app.get('/stores', async (req, res) => {
    const cacheKey = 'stores:all';

    try {
        const cachedData = await getFromCache(cacheKey);
        if (cachedData) {
            logAction('READ_STORES_FROM_CACHE', 'Fetched all stores from cache');
            return res.json(cachedData);
        }

        db.query(`SELECT * FROM stores`, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            cache(cacheKey, rows);
            logAction('READ_STORES_FROM_DB', 'Fetched all stores from DB');
            res.json(rows);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/stores/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `stores:${id}`;

    try {
        const cachedData = await getFromCache(cacheKey);
        if (cachedData) {
            logAction('READ_STORE_FROM_CACHE', `Fetched store ${id} from cache`);
            return res.json(cachedData);
        }

        db.query(`SELECT * FROM stores WHERE id = ?`, [id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (rows.length === 0) return res.status(404).json({ error: 'Store not found' });
            cache(cacheKey, rows[0]);
            logAction('READ_STORE_FROM_DB', `Fetched store ${id} from DB`);
            res.json(rows[0]);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/stores/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.query(`UPDATE stores SET name = ? WHERE id = ?`, [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        clearCache(`stores:${id}`);
        clearCache('stores:all');
        logAction('UPDATE_STORE', JSON.stringify({ id, name }));
        res.json({ message: 'Store updated successfully' });
    });
});

app.delete('/stores/:id', (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM stores WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        clearCache(`stores:${id}`);
        clearCache('stores:all');
        logAction('DELETE_STORE', `Deleted store with id ${id}`);
        res.json({ message: 'Store deleted successfully' });
    });
});

//these are other routes which are not implemented yet 
app.get('/available-stocks', async (req, res) => {
    res.json({ message: 'Available stocks logic not implemented yet' });
});

app.get('/sold-items', async (req, res) => {
    res.json({ message: 'Sold items logic not implemented yet' });
});

app.listen(PORT, () => {
    console.log(`Server running `);
});
