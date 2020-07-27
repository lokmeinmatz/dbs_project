
// import sqlite3
const sqlite3 = require('sqlite3')

async function connecteToDB(file) {
    return new Promise((res, rej) => {
        const db = new sqlite3.verbose().Database(file, err => {
            if (err) rej(err)
            else res(db)
        })
    })
}

// async main
(async () => {
    try {
        /**
         * @type {sqlite3.Database}
         */
        const db = await connecteToDB('database.sqlite')
        console.log('connected to db')
        
    } catch (e) {
        console.error(e)
        return
    }


    
})()