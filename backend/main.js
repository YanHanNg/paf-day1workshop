//Load Library 
const expres = require('express');
const mysql =  require('mysql2/promise');

//Define PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

//Create an instance of express
const app = express();











// Create the Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONN_LIMIT) || 4,
    timezone: process.env.DB_TIMEZONE || '+08:00'
})


//Start Express
pool.getConnection()
    .then(conn => {
        const param1 = Promise.resolve(conn);
        const param2 = conn.ping();
        return Promise.all( [ param1, param2 ] );
    })
    .then(results => {
        const conn = results[0];
        app.listen(PORT, () => {
            console.info(`Server Started on PORT ${PORT} at ${new Date()}`);
        })
        conn.release();
    })
    .catch(err => {
        console.error('Error in connection to mysql', err);
    })