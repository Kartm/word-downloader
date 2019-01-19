const filename = 'data.json'
let path = `${__dirname}\\${filename}`

let API_KEY = '279392f7343e9e50a825f216c6601ebab11ab52315dd5c600'

let minCorpusAmount = 6000 //how many times a (case-sensitive) word has been found, and is based on the millions of documents consumed by Wordnik
let definitionLimit = 2
let wordsLimit = 2
let getDefinitionUrl = word =>
  `https://api.wordnik.com/v4/word.json/${word}/definitions?limit=${definitionLimit}&includeRelated=false&useCanonical=false&includeTags=false&api_key=${API_KEY}`

let wordsUrl = `https://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true\
&minCorpusCount=${minCorpusAmount}&maxCorpusCount=-1\
&minDictionaryCount=1&maxDictionaryCount=-1\
&minLength=5&maxLength=-1&limit=${wordsLimit}&api_key=${API_KEY}`

let hourlyWordRequests = 40 // 1 request for 10 words, 10 requests for definitions, max is 100

let requestIntervalMs = (3600 / hourlyWordRequests) * 1000

module.exports = {
  API_KEY,
  path,
  minCorpusAmount,
  definitionLimit,
  wordsLimit,
  getDefinitionUrl,
  wordsUrl,
  requestIntervalMs
}
