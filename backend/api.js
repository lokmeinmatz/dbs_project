const { Database } = require("sqlite3"); // for typing
const { application } = require('express')

const JSON_MIME = 'application/json'



/**
 * 
 * @param {application} expressApp 
 * @param {Database} db 
 */
function startAPI(expressApp, db) {
    console.log('registering api endpoints...')
    expressApp.get('/api/status', (req, res) => {
        res.set('Content-Type', JSON_MIME)
        res.send(JSON.stringify({
            requestsServed: exports.requestsServed, // TODO count?,
            databaseConnected: db != null
        }))
    })
    
    console.log('finished registering api endpoints...')
}


exports.requestsServed = 0
exports.startAPI = startAPI