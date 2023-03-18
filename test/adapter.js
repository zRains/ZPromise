const ZPromise = require('../core')

module.exports = {
  deferred: function () {
    let result = {}

    result.promise = new ZPromise((resolve, reject) => {
      result.resolve = resolve
      result.reject = reject
    })

    return result
  },
}
