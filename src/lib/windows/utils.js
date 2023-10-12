const serialize = JSON.stringify
const deserialize = JSON.parse

function write(key, value) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, serialize(value))
  }
}

function read(key) {
  if (typeof window !== 'undefined' && window.localStorage.getItem(key) !== 'undefined') {
    return deserialize(window.localStorage.getItem(key))
  }

  return undefined
}

async function readAsync(key) {
  if (typeof window !== 'undefined' && window.localStorage.getItem(key) !== 'undefined') {
    return await deserialize(window.localStorage.getItem(key))
  }

  return undefined
}

function remove(key) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(key)
  }
}

export { write, read, remove, readAsync }
