//Load Library 
const express = require('express');
const mysql =  require('mysql2/promise');
const bodyParser = require('body-parser');
const secureEnv = require('secure-env');
const cors = require('cors');

//Create an instance of express
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

global.env = secureEnv({secret: 'isasecret'});

//Define PORT
//const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;
const PORT = global.env.APP_PORT;

const COMMON_NAMESPACE = '/api';

// Create the Database Connection Pool
const pool = mysql.createPool({
    host: global.env.MYSQL_SERVER || 'localhost',
    port: parseInt(global.env.MYSQL_SVR_PORT) || 3306,
    database: global.env.MYSQL_SCHEMA,
    user: global.env.MYSQL_USERNAME,
    password: global.env.MYSQL_PASSWORD,
    connectionLimit: parseInt(global.env.MYSQL_CONN_LIMIT) || 4,
    timezone: process.env.DB_TIMEZONE || '+08:00'
})

const queryAllRsvp = "SELECT id, name, email, phone, status, createdBy, createdDt, updatedBy, updatedDt from rsvp;";
const insertIntoRsvp = "INSERT into rsvp (name, email, phone, status, createdBy, createdDt) values (?,?,?,?,?,CURDATE());";

//Make a Closure, Take in SQLStatement and ConnPool
const makeQuery = (sql, pool) => {
    return (async (args) => {
        const conn = await pool.getConnection();
        try {
            let results = await conn.query(sql, args || []);
            //Only need first array as it contains the query results.
            //index 0 => data, index 1 => metadata
            return results[0];
        }
        catch(err) {
            console.error('Error Occurred during Query', err);
        }
        finally{
            conn.release();
        }
    })
}

const findAllRsvp = makeQuery(queryAllRsvp, pool);
const saveOneRsvp = makeQuery(insertIntoRsvp, pool);

//Create the Resources
app.get(`${COMMON_NAMESPACE}/rsvps`, (req, res) => {

    findAllRsvp([]).then(data => {
        res.status(200).json(data);
    })
    .catch(err => {
        console.error('Error During Find All RSVP', err);
    })
})

app.post(`${COMMON_NAMESPACE}/rsvp`, (req, res) => {
    console.info(req.body);
    saveOneRsvp([req.body.name, req.body.email, req.body.phone, req.body.status, 1])
        .then(result => {
            res.status(201).json(result);
        })
        .catch(err => {
            console.error('Error during Insert', err);
        })
    
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