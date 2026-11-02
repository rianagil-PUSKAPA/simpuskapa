export class ServerNotFound extends Error {
  constructor(msg = '') {
    super(msg)
  }
}

export class ServerBadRequest extends Error {
  constructor(msg = '') {
    super(msg)
  }
}

export class ServerInternalError extends Error {
  constructor(msg = '') {
    super(msg)
  }
}

export class ServerUnauthorized extends Error {
  constructor(msg = '') {
    super(msg)
  }
}

export class ServerValidationError extends Error {
  constructor(msg = '') {
    super(msg)
  }
}
