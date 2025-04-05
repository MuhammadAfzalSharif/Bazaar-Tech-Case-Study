📦 Inventory Management System (Enhanced Version)
This project is a Node.js and Express-based Inventory Management System that allows basic CRUD operations for products and stores.
It has evolved from a simple file-based setup to a more robust system using a MySQL database for persistent storage.

✅ Key Features:
Product and Store Management
Add, update, delete, and retrieve products and store data through RESTful APIs.

MySQL Integration
Replaces flat-file storage with a relational database for structured, reliable data management.

Redis Caching
Frequently accessed queries are cached using Redis to improve performance and reduce database load.

Rate Limiting
Requests are throttled using express-rate-limit to prevent abuse and ensure fair usage.

Basic Authentication
Endpoints are protected with simple basic-auth to restrict unauthorized access.

Audit Logging
Logs key actions (like updates and deletions) to the database for tracking purposes.

Structured and Clean Code
Code formatting, syntax correction, and styling have been assisted by ChatGPT for better readability and maintainability.

⚠️ Disclaimer:
This project is meant for learning and practice. Some parts may still contain bugs, lack advanced security or design patterns, 
and are not connected to a frontend interface. Future improvements may include validation, user management, and frontend integration.
