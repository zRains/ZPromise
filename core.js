/**
 * Get Type from param
 * @param {any} val
 * @returns {string}
 */
function getType(val) {
  return Object.prototype.toString.call(val)
}

/**
 * Handle next promise resolution
 * @param  {ZPromise} p
 * @param  {any} x
 * @param  {(data: any) => any} resolve
 * @param  {(reason: any) => any} reject
 */
function resolveNextPromise(p, x, resolve, reject) {
  /**
   * Implementations should not set arbitrary limits on the depth of thenable chains,
   * and assume that beyond that arbitrary limit the recursion will be infinite.
   * Only true cycles should lead to a TypeError; if an infinite chain of distinct thenables is encountered,
   * recursing forever is the correct behavior. See [3.6](https://promisesaplus.com/#point-77)
   *
   * #### Example
   *
   * ```javascript
   * const promise = new Promise((resolve, reject) => {
   *  resolve(1)
   * })
   *
   * const p1 = promise.then(value => {
   *  // do something...
   *  return p1 // Infinite recursion !!!
   * })
   * ```
   */
  if (p === x) {
    throw new TypeError('Chaining cycle detected for promise')
  }

  if (x instanceof ZPromise) {
    /**
     * If x is ZPromise, take the result and resolve promise again.
     * See [2.3.2](https://promisesaplus.com/#point-49)
     */
    x.then((wrapResult) => resolveNextPromise(p, wrapResult, resolve, reject), reject)
  } else if (getType(x) === '[object Object]' || getType(x) === '[object Function]') {
    let thenFunc

    /**
     * If retrieving the property x.then results in a thrown exception e,
     * reject promise with e as the reason.
     */
    try {
      thenFunc = x.then
    } catch (error) {
      reject(error)
    }

    if (getType(thenFunc) === '[object Function]') {
      /**
       * If both resolvePromise and rejectPromise are called,
       * or multiple calls to the same argument are made,
       * the first call takes precedence, and any further calls are ignored.
       */
      let called = false

      try {
        /**
         * [2.3.3.3] If then is a function, call it with x as this,
         * first argument resolvePromise, and second argument rejectPromise
         */
        thenFunc.call(
          x,
          (resolveData) => {
            if (called) return

            called = true
            resolveNextPromise(p, resolveData, resolve, reject)
          },
          (rejectReason) => {
            if (called) return

            called = true
            reject(rejectReason)
          },
        )
      } catch (error) {
        /**
         * [2.3.3.3] If both resolvePromise and rejectPromise are called,
         * or multiple calls to the same argument are made,
         * the first call takes precedence, and any further calls are ignored.
         */
        if (called) return

        called = true
        reject(error)
      }
    } else {
      /**
       * [2.3.4] If x is not an object or function, fulfill promise with x.
       */
      resolve(x)
    }
  } else resolve(x)
}

class ZPromise {
  /**
   * A promise must be in one of three states: pending, fulfilled, or rejected.
   * See [Promise States](https://promisesaplus.com/#promise-states)
   * @private
   * @type {'pending' | 'fulfilled' | 'rejected'}
   */
  PromiseState

  /**
   * Store final results
   * @private
   * @type {any}
   */
  PromiseResult

  /**
   * Store resolve callback
   * @private
   * @type {Array<(data: any) => void>}
   */
  onFulfilledCallbacks

  /**
   * Store reject callback
   * @private
   * @type {Array<(reason: any) => void>}
   */
  onRejectedCallbacks

  /**
   * Init Promise
   * @param {(resolve: (data: any) => void, reject: (reason: any) => void) => void} executor
   */
  constructor(executor) {
    if (typeof executor !== 'function') throw new TypeError('Promise executor is not a function')

    this.PromiseState = 'pending'
    this.PromiseResult = null
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    try {
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      this.reject(error)
    }
  }

  /**
   * Resolve promise data
   * @private
   * @param {any} data
   */
  resolve(data) {
    if (this.PromiseState === 'pending') {
      this.PromiseState = 'fulfilled'
      this.PromiseResult = data

      /** Clean resolve callback */
      this.onFulfilledCallbacks.forEach((callback) => callback())
    }
  }

  /**
   * Reject promise with reason
   * @private
   * @param {any} reason
   */
  reject(reason) {
    if (this.PromiseState === 'pending') {
      this.PromiseState = 'rejected'
      this.PromiseResult = reason

      /** Clean reject callback */
      this.onRejectedCallbacks.forEach((callback) => callback())
    }
  }

  /**
   * Core func in Promise/A+
   * @public
   * @param {(data: any) => any} [onFulfilled]
   * @param {(reason: any) => any} [onRejected]
   */
  then(onFulfilled, onRejected) {
    /** Then method must return a new Promise */
    const p = new ZPromise((resolve, reject) => {
      if (this.PromiseState === 'fulfilled') {
        setTimeout(() => {
          /**
           * [2.2.7.2]If either onFulfilled or onRejected throws an exception e,
           * promise2 must be rejected with e as the reason.
           */
          try {
            if (typeof onFulfilled === 'function') {
              /**
               * [2.2.7.1] If either onFulfilled or onRejected returns a value x,
               * run the Promise Resolution Procedure [[Resolve]](promise2, x).
               */
              const resultX = onFulfilled(this.PromiseResult)
              resolveNextPromise(p, resultX, resolve, reject)
            } else {
              /**
               * [2.2.7.3] If onFulfilled is not a function and promise1 is fulfilled,
               * promise2 must be fulfilled with the same value as promise1.
               */
              resolve(this.PromiseResult)
            }
          } catch (error) {
            reject(error)
          }
        })
      }

      if (this.PromiseState === 'rejected') {
        setTimeout(() => {
          try {
            /**
             * [2.2.7.4] If onRejected is not a function and promise1 is rejected,
             * promise2 must be rejected with the same reason as promise1.
             */
            if (typeof onRejected === 'function') {
              const reasonX = onRejected(this.PromiseResult)
              resolveNextPromise(p, reasonX, resolve, reject)
            } else {
              reject(this.PromiseResult)
            }
          } catch (error) {
            reject(error)
          }
        })
      }

      if (this.PromiseState === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          /**
           * Wrapping using macro tasks allows the callback function to execute on a new
           * round of event loops. See [2.2.4](https://promisesaplus.com/#point-34)
           */
          setTimeout(() => {
            try {
              if (typeof onFulfilled === 'function') {
                const resultX = onFulfilled(this.PromiseResult)
                resolveNextPromise(p, resultX, resolve, reject)
              } else {
                resolve(this.PromiseResult)
              }
            } catch (error) {
              reject(error)
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              if (typeof onRejected === 'function') {
                const reasonX = onRejected(this.PromiseResult)
                resolveNextPromise(p, reasonX, resolve, reject)
              } else {
                reject(this.PromiseResult)
              }
            } catch (error) {
              reject(error)
            }
          })
        })
      }
    })

    return p
  }
}

module.exports = ZPromise
