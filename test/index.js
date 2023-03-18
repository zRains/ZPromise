const promisesAplusTests = require('promises-aplus-tests')
const ZPromise = require('../core')
const adapter = require('./adapter')

// promisesAplusTests(adapter, function (err) {
//   console.log(err)
// })

const z = new ZPromise((resolve, reject) => {
  resolve('hello')
})

z.then((data) => {
  return data + ' world'
}).then((data) => {
  console.log(data + '!')
})
