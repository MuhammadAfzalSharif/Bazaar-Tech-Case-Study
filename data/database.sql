CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    quantity INT DEFAULT 0,
    price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS available_stocks (
    id VARCHAR(255) PRIMARY KEY,
    store_id VARCHAR(255),
    product_id VARCHAR(255),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS sold_items (
    sold_id VARCHAR(255) PRIMARY KEY,
    store_id VARCHAR(255),
    product_id VARCHAR(255),
    quantity INT NOT NULL,
    sell_amount INT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
