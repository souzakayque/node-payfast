var mysql = require('mysql');

function createDBConnection(){
    return mysql.createConnection ({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'payfast',
        port: 3306
    });
}

module.exports = () => {
    return createDBConnection;
}