let fs = require('fs')
const fetch = require('node-fetch')
const chalk = require('chalk')
const ON_DEATH = require('death')
const log = console.log
const config = require('./config')

let getWords = () => {
  return new Promise((resolve, reject) => {
    fetch(config.wordsUrl)
      .then(data => {
        resolve(data.json())
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
        let newWord = { id: word.id, word: word.word, definitions: [] }
        json.forEach(definition => {
          log(chalk.green('Definition: ') + word)
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

let addToFile = newWord => {
  fs.readFile(config.path, 'utf8', (err, data) => {
    if (err) throw err
    log(chalk.blue('Word: ') + newWord.word)
    fileObj.words.push(newWord)
    let jsonString = JSON.stringify(fileObj)
    fs.writeFile(config.path, jsonString, 'utf8', err => {
      if (err) throw err
    })
  })
}

setInterval(() => {
  getWords().then(words => {
    words.forEach(word => {
      addDefinitions(word).then(newWord => {
        log(newWord)
        addToFile(newWord)
      })
    })
  })
}, 5000)
//config.requestIntervalMs

ON_DEATH((signal, err) => {
  log('death')
  process.exit(0)
})
