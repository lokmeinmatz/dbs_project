// import sqlite3
const sqlite3 = require('sqlite3')

// TODO abstract sqlite3.Database away

/**
 * open sqlite3 db in async style
 * @throws if the file doesn't allready exists
 * @param {string} file The path to the db file
 * @returns {sqlite3.Database} database
 */
async function connectToDB(file) {
    return new Promise((res, rej) => {
        const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, err => {
            if (err) rej(err)
            else res(db)
        })
    })
};


exports.connectToDB = connectToDB