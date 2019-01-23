let fs = require('fs')
const fetch = require('node-fetch')
const chalk = require('chalk')
const logUpdate = require('log-update')
const ON_DEATH = require('death')
const outdent = require('outdent')
const log = console.log
const config = require('./config')

let wordsAmount = 0,
    wordsRequests = 0,
    definitionsAmount = 0,
    definitionsRequests = 0

let getWords = () => {
    return new Promise((resolve, reject) => {
        fetch(config.wordsUrl)
            .then(data => {
                return data.json()
            })
            .then(json => {
                wordsRequests += 1
                wordsAmount += json.length
                resolve(json)
            })
            .catch(err => {
                reject(err)
            })
    })
}

let addDefinitions = word => {
    return new Promise((resolve, reject) => {
        fetch(config.getDefinitionUrl(word.word))
            .then(data => {
                return data.json()
            })
            .then(json => {
                let newWord = { word: word.word, definitions: [] }
                definitionsRequests += 1
                definitionsAmount += json.length
                json.forEach(definition => {
                    newWord.definitions.push(definition.text)
                })
                resolve(newWord)
            })
            .catch(err => {
                reject(err)
            })
    })
}

let fileObj = { words: [] }
fs.readFile(config.path, 'utf8', (err, data) => {
    if (err) throw err
    fileObj = JSON.parse(data)
})

let addToFile = newWord => {
    fs.readFile(config.path, 'utf8', (err, data) => {
        if (err) throw err
        fileObj.words.push(newWord)
        let jsonString = JSON.stringify(fileObj)
        fs.writeFile(config.path, jsonString, 'utf8', err => {
            if (err) throw err
        })
    })
}

let doStop = false

startInterval(() => {
    if (doStop) process.exit(0)
    getWords().then(words => {
        words.forEach(word => {
            addDefinitions(word).then(newWord => {
                addToFile(newWord)
            })
        })
    })
})

let passedMs = 0

//todo exclude words with hyphens

setInterval(() => {
    passedMs += 1000
    if (doStop) process.exit(0)
    let test = 10000
    logUpdate(
        chalk.blue(
            `Words downloaded: ${wordsAmount} [Requests: ${wordsRequests}]
            Definitions downloaded: ${definitionsAmount} [Requests: ${definitionsRequests}]
            Seconds to next download: ${(config.requestIntervalMs -
                (passedMs % config.requestIntervalMs)) /
                1000}`
        )
    )
}, 1000)

function startInterval(callback) {
    callback()
    return setInterval(callback, config.requestIntervalMs)
}

ON_DEATH((signal, err) => {
    doStop = true
    log(chalk.red('Stopping...'))
})
