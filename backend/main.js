const connectToDB = require('./database').connectToDB;
const app = require('express')()
const apiRouting = require('./api')
const path = require('path')
const port = 3000;

// for /api/stats
app.use((req, res, next) => {
    apiRouting.requestsServed++
    next()
});

const resources = [
    'script.js',
    'style.css'
];

// async main
(async () => {
    try {
        
        const db = await connectToDB('database.sqlite')

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/index.html'))
        })

        for (const resource of resources) {
            app.get('/' + resource, (req, res) => {
                res.sendFile(path.join(__dirname, '../frontend/' + resource))
            })
        }

        apiRouting.startAPI(app, db)

        app.listen(port, () => console.log(`app listening at http://localhost:${port}`))

    } catch (e) {
        console.error('an error was thrown in main:')
        console.error(e)
    }
})()