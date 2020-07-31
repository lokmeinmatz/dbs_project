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

        
        const relative = req.query.relative != undefined

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

            lastEntry.dayData.push({date: row.date, cases: relative ? row.cases * 1000000 / row.population : row.cases, deaths: row.deaths})

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
        let waveMode = 'day'

        const relative = req.query.relative != undefined

        console.log(relative, req.query.relative)
        if (req.query.mode) waveMode = req.query.mode

        console.log('getting req with waveMin ', waveMin, ' waveMode', waveMode)
        

        

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
                    //console.log(row.population)
                    lastEntry.dayData = [{
                        date: new Date(row.date),
                        cases: relative ? (row.cases * 10000 / row.population) : row.cases
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
                    cases: relative ? (row.cases * 10000 / row.population) : row.cases
                })
            }

        }

        let datasets = []
        // fill all unknown values?
        for (const id in data) {
            //console.log('processing', id)
            const field = data[id]

            if (field.dayData != null && waveMode == 'day') {
                datasets.push({
                    geoId: field.geoId,
                    label: field.name,
                    data: field.dayData.map(e => {
                        return e.cases
                    })
                })
            }
            else if (field.dayData != null && waveMode == 'week') {
                let ddata = []
                let lastSum = 0
                for (let i = 0; i < field.dayData.length; i++) {
                    if (i % 7 == 0) {
                        ddata.push(lastSum / 7)
                        lastSum = 0
                    }

                    lastSum += field.dayData[i].cases | 0
                }


                datasets.push({
                    geoId: field.geoId,
                    label: field.name,
                    data: ddata
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
                    population: row.population,
                    bmi: row.bmi,
                    avg_age: row.avg_age,
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
        const davgAge = []
        const labels = []

        let toSort = []

        for (const id in data) {
            toSort.push(data[id])

            data[id].deathsPerCase = data[id].totalDeaths / data[id].totalCases
            //console.log(data[id].deathsPerCase, data[id].totalDeaths, data[id].totalCases)
            data[id].totalCases /= data[id].population
        }

        toSort.sort((a, b) => {
            switch (sortBy) {
                case 'bmi':
                    return a.bmi - b.bmi
                case 'deaths':
                    return a.deathsPerCase - b.deathsPerCase
                case 'gdp':
                    return a.gdp - b.gdp
                case 'avg_age':
                    return a.avg_age - b.avg_age
                default:
                    return a.totalCases - b.totalCases
            }
        })
        
        // fill all unknown values?
        for (const field of toSort) {

            dCases.push(field.totalCases)
            dCasesPDeath.push(field.deathsPerCase)
            dbmi.push(field.bmi)
            davgAge.push(field.avg_age)
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
                    label: 'Avg Age', 
                    yAxisID: 'avg_age', 
                    backgroundColor: 'rgba(255, 0, 200, 1)',
                    data: davgAge
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


    expressApp.get('/api/corona/death-age', async (req, res) => {
        // this displays a bar chart
        // * total corona cases
        // * deaths / case
        // * bmi
        // * gdp / person
        const rows = await db.allAsync('SELECT * FROM day_stats JOIN country USING (geoId)')
        
        console.log('getting death-age')


        
        let data = {}
        for (const row of rows) {
            //console.log(row.geoId)
            let lastEntry = data[row.geoId]
            if (lastEntry == undefined) {
                lastEntry = {
                    name: row.name,
                    totalCases: 0,
                    totalDeaths: 0,
                    avg_age: row.avg_age
                };
                data[row.geoId] = lastEntry
            }

            lastEntry.totalCases += row.cases
            lastEntry.totalDeaths += row.deaths
        }

        let dDeathsPerCase = []
        let  davgAge = []
        let labels = []

        let toSort = []

        for (const id in data) {
            toSort.push(data[id])

            data[id].deathsPerCase = data[id].totalDeaths / data[id].totalCases
        }

        toSort.sort((a, b) => a.avg_age - b.avg_age)

        toSort = toSort.filter(e => Number.isFinite(e.deathsPerCase) && Number.isFinite(e.avg_age))
        
        // fill all unknown values?
        for (const field of toSort) {

            dDeathsPerCase.push(field.deathsPerCase)
            davgAge.push(field.avg_age)
            labels.push(field.name)

        }

        // average of 5
        dDeathsPerCase = dDeathsPerCase.reduce(([sum, count, arr], curr) => {
            sum += curr
            if (count == 5) {
                arr.push(sum / 5)
                sum = 0
                count = -1
            }
            count++
            return [sum, count, arr]
        }, [0, 0, []])[2]

        // average of 5
        davgAge = davgAge.reduce(([sum, count, arr], curr) => {
            sum += curr
            count++
            if (count == 5) {
                arr.push(sum / 5)
                sum = 0
                count = 0
            }
            return [sum, count, arr]
        }, [0, 0, []])[2]
        

        let nLabels = []

        for(let i = 0; i < labels.length; i++) {
            if (i % 5 == 0) nLabels.push(labels[i]) 
        }


        // sum, count
        console.log(dDeathsPerCase)
        console.log(nLabels)

        res.json({
            labels: nLabels,
            datasets: [
                {
                    label: 'Avg Age', 
                    yAxisID: 'avg_age', 
                    backgroundColor: 'rgba(255, 0, 200, 0.2)',
                    data: davgAge
                },
                {
                    label: 'Deaths per Case', 
                    yAxisID: 'deaths', 
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    data: dDeathsPerCase
                }
            ]
        })
    })
    
    console.log('finished registering api endpoints...')
}


exports.requestsServed = 0
exports.startAPI = startAPI