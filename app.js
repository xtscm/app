// app.js
const express = require('express');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3000;

// CHANGE THIS FOR EACH VERSION
const VERSION = "v1.0.0";

// Database config
const config = {
    user: process.env.DB_USER || 'dbadmin',
    password: process.env.DB_PASSWORD || 'Password123!',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'app-database',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Initialize database
async function initDatabase() {
    try {
        await sql.connect(config);
        
        // Create test table if not exists
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test' AND xtype='U')
            CREATE TABLE test (
                id INT PRIMARY KEY IDENTITY(1,1),
                value NVARCHAR(100) NOT NULL,
                created_at DATETIME DEFAULT GETDATE()
            )
        `);
        
        // Add sample data if table is empty
        const result = await sql.query('SELECT COUNT(*) as count FROM test');
        if (result.recordset[0].count === 0) {
            await sql.query("INSERT INTO test (value) VALUES ('Initial data')");
            await sql.query("INSERT INTO test (value) VALUES ('Sample value')");
        }
        
        console.log('Database ready');
    } catch (err) {
        console.error('Database error:', err);
    }
}

// Main route
app.get('/', async (req, res) => {
    let data = [];
    
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT * FROM test');
        data = result.recordset;
    } catch (err) {
        console.error('Query error:', err);
    }
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Version ${VERSION}</title>
        <style>
            body { font-family: monospace; padding: 20px; }
            h1 { font-size: 3em; }
            table { border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 10px; }
        </style>
    </head>
    <body>
        <h1>VERSION: ${VERSION}</h1>
        
        <h2>Database Table: test</h2>
        <table>
            <tr>
                <th>ID</th>
                <th>Value</th>
                <th>Created At</th>
            </tr>
            ${data.map(row => `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.value}</td>
                    <td>${row.created_at}</td>
                </tr>
            `).join('')}
        </table>
        
        <p>Total rows: ${data.length}</p>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} - Version ${VERSION}`);
    initDatabase();
});