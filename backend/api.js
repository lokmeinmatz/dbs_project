const { Database } = require("sqlite3"); // for typing
const { application } = require('express')




/**
 * 
 * @param {application} expressApp 
 * @param {Database} db 
 */
function startAPI(expressApp, db) {
    console.log('registering api endpoints...')
    expressApp.get('/api/status', (req, res) => {
        res.json({
            requestsServed: exports.requestsServed, // TODO count?,
            databaseConnected: db != null
        })
    })

    expressApp.get('/api/corona/all-countries', async (req, res) => {
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

        res.json({
            start: first,
            last,
            data
        })
    })

    expressApp.get('/api/corona/by-wave-start', async (req, res) => {
        const rows = await db.allAsync('SELECT * FROM day_stats JOIN country USING (geoId) ORDER BY date')
        let waveMin = 50

        if (req.query.min && Number.isFinite(parseInt(req.query.min))) {
            waveMin = parseInt(req.query.min)
        }
        console.log('getting req with waveMin ', waveMin)
        

        

        let data = {}
        for (const row of rows) {
            //console.log(row.geoId)
            let lastEntry = data[row.geoId]
            if (lastEntry == undefined) {
                lastEntry = {
                    name: row.name,
                    dayData: null
                };
                data[row.geoId] = lastEntry
            }

            if (lastEntry.dayData != null || row.cases >= waveMin) {
                if (lastEntry.dayData == null) {
                    lastEntry.dayData = [{
                        date: new Date(row.date),
                        cases: row.cases
                    }]
                    continue
                }
                const rowDate = new Date(row.date)
                /**
                 * @type {Date}
                 */
                let curr = lastEntry.dayData[lastEntry.dayData.length - 1].date
                curr.setDate(curr.getDate() + 1)
                while (curr < rowDate) {
                    lastEntry.dayData.push({
                        date: curr,
                        cases: null
                    })
                    curr.setDate(curr.getDate() + 1)
                }

                lastEntry.dayData.push({
                    date: new Date(row.date),
                    cases: row.cases
                })
            }

        }

        let datasets = []
        // fill all unknown values?
        for (const id in data) {
            //console.log('processing', id)
            const field = data[id]

            if (field.dayData != null) {
                datasets.push({
                    geoId: field.geoId,
                    label: field.name,
                    data: field.dayData.map(e => {
                        return e.cases
                    })
                })
            }
            
        }
        res.json(datasets)
    })

    expressApp.get('/api/corona/bmi-gdp-death-ratio', async (req, res) => {
        // this displays a bar chart
        // * total corona cases
        // * deaths / case
        // * bmi
        // * gdp / person
        const rows = await db.allAsync('SELECT * FROM day_stats JOIN country USING (geoId)')
        let sortBy = 'cases'
        if (req.query['sort-by']) sortBy = req.query['sort-by']
        
        console.log('getting bar data | sort by ' + sortBy)


        
        let data = {}
        for (const row of rows) {
            //console.log(row.geoId)
            let lastEntry = data[row.geoId]
            if (lastEntry == undefined) {
                lastEntry = {
                    name: row.name,
                    totalCases: 0,
                    totalDeaths: 0,
                    bmi: row.bmi,
                    gdp: row.gdp_per_person
                };
                data[row.geoId] = lastEntry
            }

            lastEntry.totalCases += row.cases
            lastEntry.totalDeaths += row.deaths
        }

        const dCases = []
        const dCasesPDeath = []
        const dbmi = []
        const dgdp = []
        const labels = []

        let toSort = []

        for (const id in data) {
            toSort.push(data[id])
        }

        toSort.sort((a, b) => {
            switch (sortBy) {
                case 'bmi':
                    return a.bmi - b.bmi
                case 'deaths':
                    return a.totalDeaths - b.totalDeaths
                case 'gdp':
                    return a.gdp - b.gdp
                default:
                    return a.totalCases - b.totalCases
            }
        })
        
        // fill all unknown values?
        for (const field of toSort) {


            dCases.push(field.totalCases)
            dCasesPDeath.push(field.totalDeaths / field.totalCases)
            dbmi.push(field.bmi)
            dgdp.push(field.gdp)
            labels.push(field.name)

        }
        res.json({
            labels,
            datasets: [
                {
                    label: 'Cases', 
                    yAxisID: 'cases', 
                    backgroundColor: 'rgba(255, 0, 0, 1)',
                    data: dCases
                },
                {
                    label: 'Deaths per Case', 
                    yAxisID: 'deaths', 
                    backgroundColor: 'rgba(0, 255, 0, 1)',
                    data: dCasesPDeath
                },
                {
                    label: 'BMI', 
                    yAxisID: 'bmi', 
                    backgroundColor: 'rgba(0, 0, 255, 1)',
                    data: dbmi
                },
                {
                    label: 'GDP', 
                    yAxisID: 'gdp', 
                    backgroundColor: 'rgba(200, 100, 0, 1)',
                    data: dgdp
                }
            ]
        })
    })
    
    console.log('finished registering api endpoints...')
}


exports.requestsServed = 0
exports.startAPI = startAPI