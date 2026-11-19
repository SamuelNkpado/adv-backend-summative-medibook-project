class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.expose = true;
    if (extra) {
      this.extra = extra;
    }
  }
}

module.exports = { HttpError };