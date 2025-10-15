const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, Object.keys(meta).length ? meta : '');
  },
  debug: (message, meta = {}) => {
    console.log(`[DEBUG] ${message}`, Object.keys(meta).length ? meta : '');
  }
};

module.exports = logger;