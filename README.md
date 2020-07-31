# DBS project SoSe 2020

by John Jung, Justin Sudbrak, Matthias Kind

## how to run

1. install [node](https://nodejs.org/en/)
2. clone this repo (easiest via [GithubDesktop](https://desktop.github.com/)
3. run `npm install` in the main folder
4. run `node ./backend/main.js` to start the server
5. go to http://localhost:3000/api/status to see if it's working

## Structure

### Backend

Contains all backend related code

api : mounts and handles api endpoints (which server json over http)

database : handles database requests. TODO: abstract sqlite3.Database fully away so this is the only file we touch it

main : starts server and host static content (TODO)


### Database

primary keys are __bold__
foreign keys are *italic*

COUNTRY(__geoId__, name, population, continent, bmi, gdp_per_person, avg_age)

DAY_STATS(__date, *geoId*__, cases, deaths)

        
## Sources

### Used

- covid19.json from KVV
  - removed "Other"-continent with this weird japan thing

- bmi_2020.csv: [https://worldpopulationreview.com/country-rankings/most-obese-countries](https://worldpopulationreview.com/country-rankings/most-obese-countries)

- gdb.csv: [https://worldpopulationreview.com/countries/countries-by-gdp](https://worldpopulationreview.com/countries/countries-by-gdp)

- daily.json / American cases per day [https://covidtracking.com/api/v1/us/daily.json](https://covidtracking.com/api/v1/us/daily.json)


### Could be used

[https://ourworldindata.org/life-expectancy](https://ourworldindata.org/life-expectancy)


## Endpoints

### /

Serves html (maybe use multiple endpoints for diffrent visualizations?)

### /api/status

JSON server status to check if its working
