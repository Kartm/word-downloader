const testPromise = text => {
    return new Promise((resolve, reject) => {
        resolve(text)
    })
}

tasks = []
tasks.push(testPromise('1'))
tasks.push(testPromise('2'))

Promise.all(tasks).then(x => {
    console.log(x)
})
