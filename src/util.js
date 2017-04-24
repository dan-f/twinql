/**
 * Iterates over key, value pairs in an object
 * @param {Object} obj
 * @returns {Iterator<Array>} an iterator yielding arrays of the form [k, v]
 */
export function * iterObj (obj) {
  for (let k of Object.keys(obj)) {
    yield [k, obj[k]]
  }
}
