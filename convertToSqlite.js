
const connectToDB = require('./backend/database').connectToDB;
const fs = require('fs');

/*

Insert here how the json and csv data gets inserted into the sqlite file.

!! make sure not to double insert data !!

*/

// async main
(async () => {
    try {

       await loadGDP()

    } catch (e) {
        console.error(e)
        return
    }
    
    
    
})();

async function loadBaseJson() {
    const db = await connectToDB('database.sqlite')
    console.log('connected to db')


    // load file
    const f = JSON.parse(fs.readFileSync('./sources/covid19.json'))
    // or ignore because geoId and name are unique
    db.exec('BEGIN TRANSACTION')
    
    const countryStatement = db.prepare('INSERT OR IGNORE INTO country (geoId, name, population, continent) VALUES (?, ?, ?, ?)')
    const statsStatement = db.prepare('INSERT INTO day_stats (date, geoId, cases, deaths) VALUES (?, ?, ?, ?)')
    
    for (const entry of f.records) {
        // sqlite date fromat: YYYY-MM-DD as string
        const sqlDateFormat = `${entry.year}-${entry.month.padStart(2, '0')}-${entry.day.padStart(2, '0')}`
        countryStatement.run(entry.geoId, entry.countriesAndTerritories, entry.popData2018, entry.continentExp)
        statsStatement.run(sqlDateFormat, entry.geoId, entry.cases, entry.deaths)
        console.log(`${sqlDateFormat} -> ${entry.geoId}`)
    }
    
    countryStatement.finalize()
    statsStatement.finalize()
    db.exec('END TRANSACTION')
}


async function loadBMI() {
    const db = await connectToDB('database.sqlite')
    console.log('connected to db')

 // load file
    /**
     * @type {string}
     */
    const f = fs.readFileSync('./sources/bmi_2020.csv', 'utf-8')
    //console.log(f)

    // or ignore because geoId and name are unique
    db.exec('BEGIN TRANSACTION')
    //return
    const bmiStatement = db.prepare('UPDATE country SET bmi = ? WHERE name = ? COLLATE NOCASE');
    
    for (const line of f.split('\n')) {
        if (line.startsWith('"country"')) continue
        // sqlite date fromat: YYYY-MM-DD as string
        const d = line.split(',')
        const country = d[0].replace(' ', '_').replace(/"/g, '')
        let bmi = d[2]
        if (bmi == '""') {
            console.log(`Skipping ${country}`)
            continue
        }

        bmi = parseFloat(bmi.replace(/"/g, ''))
        bmiStatement.run([bmi, country], (r, e) => {
            if (e) console.error(e)
            //console.log(r)
        })
    }
    
    bmiStatement.finalize()
    db.exec('END TRANSACTION')
}



async function loadGDP() {
    const db = await connectToDB('database.sqlite')
    console.log('connected to db')

 // load file
    /**
     * @type {string}
     */
    const f = fs.readFileSync('./sources/gdp.csv', 'utf-8')
    //console.log(f)

    // or ignore because geoId and name are unique
    db.exec('BEGIN TRANSACTION')
    //return
    const stmt = db.prepare('UPDATE country SET gdp_per_person = ? WHERE name = ? COLLATE NOCASE');
    
    for (const line of f.split('\n')) {
        if (line.startsWith('"rank"')) continue
        // sqlite date fromat: YYYY-MM-DD as string
        const d = line.split(',')
        const country = d[1].replace(' ', '_').replace(/"/g, '')
        let gdp = d[4]
        if (gdp == '""') {
            console.log(`Skipping ${country}`)
            continue
        }

        gdp = parseFloat(gdp.replace(/"/g, ''))
        stmt.run([gdp, country], (r, e) => {
            if (e) console.error(e)
            //console.log(r)
        })
    }
    
    stmt.finalize()
    db.exec('END TRANSACTION')
}