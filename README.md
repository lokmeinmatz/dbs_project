# DBS project SoSe 2020

by John Jung, Justin Sudbrak, Matthias Kind

## Structure

### Backend

Contains all backend related code

api : mounts and handles api endpoints (which server json over http)

database : handles database requests. TODO: abstract sqlite3.Database fully away so this is the only file we touch it

main : starts server and host static content (TODO)

## Sources

### Used

- bmi_2020.csv: [https://worldpopulationreview.com/country-rankings/most-obese-countries](https://worldpopulationreview.com/country-rankings/most-obese-countries)

- gdb.csv: [https://worldpopulationreview.com/countries/countries-by-gdp](https://worldpopulationreview.com/countries/countries-by-gdp)


### Could be used

[https://ourworldindata.org/life-expectancy](https://ourworldindata.org/life-expectancy)


## Endpoints

### /

Serves html (maybe use multiple endpoints for diffrent visualizations?)

### /api/status

JSON server status to check if its working