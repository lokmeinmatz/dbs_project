// chartjs.org

/**
 * @param {HTMLCanvasElement} canvas
 * @param {any} data 
 * @returns {any} chart
 */
function displayDateChart(canvas, data) {
    const ctx = canvas.getContext('2d')

    const chart = new Chart(ctx, {
        type: 'line',
        data
    })

    return chart
}

let chart
let allCovidData

/**
 * Generate all labels a la YYYY-MM-DD including the boundaries
 * @param {string} from 
 * @param {string} to 
 * @returns {string[]}
 */
function genLabels(from, to) {
    let start = new Date(from)
    let end = new Date(to)

    let labels = []

    while (start <= end) {
        labels.push(`${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`)
        start.setDate(start.getDate() + 1)
    }

    return labels
}

async function loaded() {
    const canv1 = document.createElement('canvas')
    canv1.setAttribute('width', '500')
    canv1.setAttribute('height', '300')
    document.body.appendChild(canv1)

    const res = await (await fetch('/api/corona/all-countries')).json()
    
    // generate all labels
    const labels = genLabels(res.start, res.last)
    console.log(labels)
    // manipulate data for usage
    let adapted = res.data.map(e => {
        let data = e.dayData.sort((a, b) => {
            if (a.date > b.date) return 1
            else if (a.date < b.date) return -1
            return 0
        })

        // fill all gaps
        let labelIndex = 0
        let dataIndex = 0
        let finalData = []
        while (labelIndex < labels.length && dataIndex < data.length) {
            while (data[dataIndex].date > labels[labelIndex]) {
                finalData.push(NaN)
                labelIndex++
            }
            while(dataIndex < data.length && data[dataIndex].date == labels[labelIndex]) {
                finalData.push(data[dataIndex].cases)
                dataIndex++
                labelIndex++
            }
            //if (data[dataIndex].date < labels[labelIndex]) break
        }
        console.log(finalData)

        return {
            label: e.name,
            data: finalData
        }
    })
    console.log(adapted[3].data[32])
    allCovidData = adapted.filter(e => e.data.some(v => Number.isNaN(v)))
    ///console.log(adapted)

    chart = displayDateChart(canv1, {
        labels,
        datasets: adapted
    })

    const updateMinFilter = (v) => {
        document.querySelector('#filter > p').textContent = v.target.value
    }

    document.querySelector('#min_cases').addEventListener('input', updateMinFilter)


    document.querySelector('#min_cases').addEventListener('mouseup', v => {
        console.log(v.target.value)
        chart.data.datasets = allCovidData.filter(e => {
            return Math.max(0, ...e.data.filter(Number.isFinite)) > v.target.value
        })
        chart.update()
        console.log('chart updated')
    })
}
    



