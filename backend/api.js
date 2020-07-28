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

    expressApp.get('/api/corona/all-countries', async (req, res) => {
        res.set('Content-Type', JSON_MIME)
        const rows = await db.allAsync('SELECT * FROM day_stats JOIN country USING (geoId) ORDER BY geoId')
        let data = []
        for (const row of rows) {
            let lastEntry = null
            if (data.length == 0 || data[data.length - 1].geoId != row.geoId) {
                lastEntry = {
                    name: row.name,
                    geoId: row.geoId,
                    dayData: []
                };
                data.push(lastEntry)
            } else { lastEntry = data[data.length - 1] }

            lastEntry.dayData.push({date: row.date, cases: row.cases, deaths: row.deaths})

        }

        // find lowest entry in days
        let first = data[0].dayData[0].date
        let last = data[0].dayData[0].date
        
        for (let c of data) {
            for (let d of c.dayData) {
                if (d.date < first) {
                    first = d.date
                }
                if (d.date > last) {
                    last = d.date
                }
            }
        }

        console.log('span: ', first, last)

        // fill all unknown values?

        res.send(JSON.stringify({
            start: first,
            last,
            data
        }))
    })
    
    console.log('finished registering api endpoints...')
}


exports.requestsServed = 0
exports.startAPI = startAPI