const { pool } = require('./db-mysql');

function formatRow(row) {
    if (!row) return row;
    const formatted = { ...row };
    
    // Convert Date objects to YYYY-MM-DD strings
    if (formatted.trade_date instanceof Date) {
        formatted.trade_date = formatted.trade_date.toISOString().split('T')[0];
    }
    
    // Convert numeric fields from strings to numbers
    ['pl', 'pnl', 'entry_price', 'exit_price', 'size', 'confidence'].forEach(field => {
        if (formatted[field] !== undefined && formatted[field] !== null) {
            const num = Number(formatted[field]);
            if (!isNaN(num)) {
                formatted[field] = num;
            }
        }
    });
    
    return formatted;
}

const dbClient = {
    all: (query, params, callback) => {
        pool.query(query, params, (err, results) => {
            if (results) {
                results = results.map(formatRow);
            }
            callback(err, results);
        });
    },

    get: (query, params, callback) => {
        pool.query(query, params, (err, results) => {
            const row = results && results.length > 0 ? results[0] : null;
            callback(err, formatRow(row));
        });
    },

    run: (query, params, callback) => {
        pool.execute(query, params, function(err, results) {
            if (callback) {
                callback.call({ lastID: results?.insertId, changes: results?.affectedRows }, err, results);
            }
        });
    }
};

module.exports = { dbClient };
