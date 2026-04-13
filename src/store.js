/**
 * store.js — Simple reactive state store with event bus
 */

class Store {
  #state;
  #listeners;

  constructor(initialState = {}) {
    this.#state = { ...initialState };
    this.#listeners = new Map();
  }

  /** Get a state value */
  get(key) {
    return this.#state[key];
  }

  /** Get entire state */
  getAll() {
    return { ...this.#state };
  }

  /** Set one or more state values, notifying listeners */
  set(updates) {
    const prev = { ...this.#state };
    this.#state = { ...this.#state, ...updates };

    // Notify listeners for each changed key
    for (const key of Object.keys(updates)) {
      if (prev[key] !== this.#state[key]) {
        this.#emit(key, this.#state[key], prev[key]);
      }
    }
    this.#emit('*', this.#state, prev);
  }

  /** Subscribe to a key change. Returns unsubscribe function. */
  subscribe(key, callback) {
    if (!this.#listeners.has(key)) {
      this.#listeners.set(key, new Set());
    }
    this.#listeners.get(key).add(callback);
    return () => this.#listeners.get(key)?.delete(callback);
  }

  #emit(key, newVal, oldVal) {
    this.#listeners.get(key)?.forEach(cb => {
      try { cb(newVal, oldVal); } catch (e) { console.error('Store listener error:', e); }
    });
  }
}

// App global store
export const store = new Store({
  user: null,          // authenticated user object
  isAuthenticated: false,
  isLoadingAuth: true,
  currentRoute: null,
  autoEnabled: false,
  autoSchedule: 'daily',
  lastRun: null,
  nextRun: null,
});

/**
 * Simple event bus for cross-component communication
 */
class EventBus {
  #handlers;

  constructor() {
    this.#handlers = new Map();
  }

  on(event, handler) {
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, new Set());
    }
    this.#handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#handlers.get(event)?.delete(handler);
  }

  emit(event, ...args) {
    this.#handlers.get(event)?.forEach(h => {
      try { h(...args); } catch (e) { console.error('EventBus error:', e); }
    });
  }

  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

export const bus = new EventBus();
