const db = require('./db');

const getManufacturers = (callback) => {
    const connection = db.connectDB();
    const query = 'SELECT manufacturer_id, manufacturer_name FROM manufacturer_tbl';

    connection.query(query, (err, results) => {
        db.disconnectDB();
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

module.exports = { getManufacturers };