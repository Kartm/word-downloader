const { rword } = require('rword')
const wd = require('word-definition')
const ON_DEATH = require('death')
const log = require('single-line-log').stdout
const fs = require('fs')

let totalWordsToDownload = null
let wordsDownloaded = 0
let avgResponseTime = null

//todo timeout

let getTimeElapsedMs = start => {
    let diff = process.hrtime(start)
    let diffNs = diff[0] * 1e9 + diff[1]
    let diffMs = diffNs / 1e6
    return diffMs
}

let printStats = ({ currentWord, diffMs }) => {
    percentage = Math.floor(
        ((wordsDownloaded + 1) / totalWordsToDownload) * 100
    )

    if (avgResponseTime === null) {
        avgResponseTime = diffMs
    } else {
        avgResponseTime = (diffMs + avgResponseTime) / 2
    }

    let displayTime = Math.floor(avgResponseTime)
    log(
        `Current word: ${currentWord}\nAverage response time: ${displayTime} ms\nWord ${wordsDownloaded +
            1} out of ${totalWordsToDownload}\n[${percentage}%]`
    )
    wordsDownloaded += 1
}

let doStop = false

let finish = () => {
    console.log('Ended.')
    process.exit(0)
}

const fetchDef = word => {
    return new Promise((resolve, reject) => {
        wd.getDef(word, 'en', { hyperlinks: 'none' }, def => {
            resolve(def)
            //handle errors
        })
        if (doStop) {
            reject(new Error('Download canceled.'))
        }
    })
}

let tasks = []

let getWords = amount => {
    let totalTimerStart = process.hrtime()
    return new Promise((resolve, reject) => {
        let randomWords = rword.generate(amount, {
            length: '4-10',
            contains: /^[^-]+$/
        })
        totalWordsToDownload = amount

        randomWords.forEach(word => {
            currentWord = word
            tasks.push(
                new Promise((resolve, reject) => {
                    let start = process.hrtime()
                    fetchDef(word)
                        .then(def => {
                            resolve(def)
                            printStats({
                                currentWord: word,
                                diffMs: getTimeElapsedMs(start)
                            })
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
            )
        })

        Promise.all(tasks).then(results => {
            resolve({ results, timeElapsed: getTimeElapsedMs(totalTimerStart) })
        })
    })
}

//* probably not needed because we already provide regex in the random word generator
let filterWords = words => {
    let regex = new RegExp('^[a-z]+$', 'gi')
    let withDefinitions = words.filter(w => {
        return !w.hasOwnProperty('err')
    })
    console.log(withDefinitions)
    let englishLettersOnly = withDefinitions.filter(w => {
        return regex.test(w.word)
    })
    console.log(englishLettersOnly)
    return englishLettersOnly
}

let saveWordsToFile = data => {
    let currentTime = new Date().toISOString()
    let filename = currentTime
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .replace(/\:/g, '-')
    let filteredWords = filterWords(data)
    let toSave = JSON.stringify({ words: filteredWords })
    fs.writeFile(`./download/${filename}.json`, toSave, err => {
        if (err) throw err
        console.log('Saved to file.')
    })
}

getWords(1723).then(result => {
    let json = result.results
    let timeElapsed = Math.floor(result.timeElapsed / 1000)
    log.clear()
    log(
        `Finished. Downloading ${
            json.length
        } words took ${timeElapsed} seconds.`
    )
    saveWordsToFile(json)
})

ON_DEATH((signal, err) => {
    doStop = true
    // log.clear()
    // log('Stopping...')
})
