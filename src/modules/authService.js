const db = require('./db');

const authenticateUser = (email, password, callback) => {
    const connection = db.connectDB();
    const query = 'SELECT * FROM user_tbl WHERE mail = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            db.disconnectDB();
            return callback(err);
        }
        if (results.length > 0) {
            const user = results[0];
            // console.log('Database user:', user);
            // console.log('Input password:', password);
            if (password === user.pass) {
                callback(null, user);
            } else {
                callback(null, null);
            }
        } else {
            db.disconnectDB();
            callback(null, null);
        }
    });
};

module.exports = { authenticateUser };