# ZPromise <a href="http://promises-aplus.github.com/promises-spec"><img src="https://promisesaplus.com/assets/logo-small.png" align="right" alt="Promises/A+ logo" /></a>

ZPromise is a lightweight Promises library that supports [A+ Promises](https://promisesaplus.com/).

Promises/A+ Compliance Test Suite ALL PASSED!

### Usage

```javascript
const z = new ZPromise((resolve, reject) => {
  resolve('hello')
})

z.then((data) => {
  return data + ' world'
}).then((data) => {
  console.log(data + '!') // hello world!
})
```

### License

MIT.
