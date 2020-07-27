
const connectToDB = require('./backend/database').connectToDB;


/*

Insert here how the json and csv data gets inserted into the sqlite file.

!! make sure not to double insert data !!

*/

// async main
(async () => {
    try {
        /**
         * @type {sqlite3.Database}
         */
        const db = await connectToDB('database.sqlite')
        console.log('connected to db')
    } catch (e) {
        console.error(e)
        return
    }
    
    
    
})();

