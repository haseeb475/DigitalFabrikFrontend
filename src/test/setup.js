// Vitest global test setup.
// - Adds jest-dom matchers (toBeInTheDocument, etc.) for component tests.
// - Provides a localStorage stub when the test environment does not expose one,
//   which the mock-API persistence property tests depend on.
import '@testing-library/jest-dom/vitest'

function createLocalStorageStub() {
  let store = new Map()
  return {
    getItem(key) {
      return store.has(String(key)) ? store.get(String(key)) : null
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
    removeItem(key) {
      store.delete(String(key))
    },
    clear() {
      store = new Map()
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    get length() {
      return store.size
    },
  }
}

// jsdom usually provides localStorage, but some environments (e.g. Node's
// experimental built-in localStorage) expose a non-functional object instead.
// Install the stub whenever a working localStorage is not available.
function hasWorkingLocalStorage() {
  try {
    const ls = globalThis.localStorage
    return !!ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function'
  } catch {
    return false
  }
}

if (!hasWorkingLocalStorage()) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createLocalStorageStub(),
    writable: true,
    configurable: true,
  })
}
