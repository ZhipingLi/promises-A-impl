# promises-A-plus-impl

JS Promise implemenation following Promises/A+ standard



## Standard:

Promises/A+ (https://promisesaplus.com/)

An open standard for sound, interoperable JavaScript promises—by implementers, for implementers.



## The implemented APIs include:

- Promise.prototype.then()
- Promise.prototype.catch()
- Promise.prototype.finally()
- Promise.resolve()
- Promise.reject()
- Promise.all()
- Promise.allSettled()
- Promise.race()
- Promise.any()



## Example:

```js
import MyPromise from "./index.js";

// 链式调用
MyPromise.reject("rejected")
.catch(err => {
  console.log("err: " + err)
  return "fulfilled"
})
.then(res => console.log("res: " + res))
.finally(() => console.log("finally"))

// 并列调用
const p = new MyPromise(resolve => resolve("fulfilled"))
p.then(res => console.log("res1: " + res))
p.then(res => console.log("res2: " + res), err => console.log("err1: " + err))
p.catch(err => console.log("err2: " + err))

MyPromise.allSettled([
  MyPromise.resolve("fulfilled"),
  MyPromise.reject("rejected")
]).then(res => console.log(res))

```

