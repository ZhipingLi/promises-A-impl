/**
 * Standard:
 * Promises/A+ (https://promisesaplus.com/)
 * An open standard for sound, interoperable JavaScript promises—by implementers, for implementers.
 */

import {
  PROMISE_STATUS_FULILLED,
  PROMISE_STATUS_PENDING,
  PROMISE_STATUS_REJECTED
} from "./constant.js";

export default class MyPromise {
  constructor(executor) {
    this.status = PROMISE_STATUS_PENDING
    this.result = undefined
    this.error = undefined
    this.onFulfilledFns = []
    this.onRejectedFns = []

    const resolve = (result) => {
      // Promise的状态一旦确定，就不能再改变
      if(this.status === PROMISE_STATUS_PENDING){
        queueMicrotask(() => {
          // 解决在Promise的状态还未确认之前，resolve和reject都被调用后的情况
          // 该种情况下，resolve和reject中的Microtask(状态改变和状态回调函数)都会进入微任务队列中等待回调
          if(this.status !== PROMISE_STATUS_PENDING) return
          // 状态改变
          this.status = PROMISE_STATUS_FULILLED
          this.result = result
          // 执行状态回调函数
          this.onFulfilledFns.forEach(fn => fn())
        })
      }
    }

    const reject = (error) => {
      if(this.status === PROMISE_STATUS_PENDING){
        queueMicrotask(() => {
          if(this.status !== PROMISE_STATUS_PENDING) return
          this.status = PROMISE_STATUS_REJECTED
          this.error = error
          this.onRejectedFns.forEach(fn => fn())
        })
      }
    }

    // 处理executor中出现异常导致rejected状态的情况
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = onFulfilled || (result => result)
    onRejected = onRejected || (error => { throw error })

    return new MyPromise((resolve, reject) => {
      // 执行.then()时，状态还没确定下来
      if(this.status === PROMISE_STATUS_PENDING){
        this.onFulfilledFns.push(() => execFunctionWithCatchError(onFulfilled, this.result, resolve, reject))
        this.onRejectedFns.push(() => execFunctionWithCatchError(onRejected, this.error, resolve, reject))
      }
      // 执行.then()时，状态已经确定下来
      if(this.status === PROMISE_STATUS_FULILLED){
        execFunctionWithCatchError(onFulfilled, this.result, resolve, reject)
      }
      if(this.status === PROMISE_STATUS_REJECTED){
        execFunctionWithCatchError(onRejected, this.error, resolve, reject)
      }
    })
  }

  catch(onRejected) {
    return this.then(undefined, onRejected)
  }

  finally(onFinally) {
    return this.then(onFinally, onFinally)
  }

  static resolve(result) {
    return new MyPromise(resolve => resolve(result))
  }

  static reject(error) {
    return new MyPromise((resolve, reject) => reject(error))
  }

  static all(promises) {
    const results = []
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(result => {
          results.push(result)
          if(results.length === promises.length) resolve(results)
        }, reject)
      });
    })
  }

  static allSettled(promises) {
    const results = []
    return new MyPromise(resolve => {
      promises.forEach(promise => {
        promise.then(result => {
          results.push({ status: PROMISE_STATUS_FULILLED, value: result })
          if(results.length === promises.length) resolve(results)
        }, error => {
          results.push({ status: PROMISE_STATUS_REJECTED, value: error })
          if(results.length === promises.length) resolve(results)
        })
      })
    })
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve, reject)
      })
    })
  }

  static any(promises) {
    const errors = []
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve, error => {
          errors.push(error)
          // AggregateError: ES2021新增
          if(errors.length === promises.length) reject(new AggregateError(errors))
        })
      })
    })
  }
}

// 处理状态回调函数中出现异常导致rejected状态的情况
function execFunctionWithCatchError(fn, value, resolve, reject) {
  try {
    const result = fn(value)
    resolve(result)
  } catch (error) {
    reject(error)
  }
}