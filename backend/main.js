const connectToDB = require('./database').connectToDB;
const app = require('express')()
const apiRouting = require('./api')
const port = 3000;

// for /api/stats
app.use((req, res, next) => {
    apiRouting.requestsServed++
    next()
});

// async main
(async () => {
    try {
        
        const db = await connectToDB('database.sqlitee')

        app.get('/', (req, res) => {
            res.send('Hier kommt ne geile Seite hin')
        })

        apiRouting.startAPI(app, db)

        app.listen(port, () => console.log(`app listening at http://localhost:${port}`))

    } catch (e) {
        console.error('an error was thrown in main:')
        console.error(e)
    }
})()