function UserError(message) {
  var error = Error.call(this, message);

  this.name = 'UserError';
  this.message = error.message;
  this.stack = error.stack;
  this.innerError = null;
}

UserError.prototype = Object.create(Error.prototype);
UserError.prototype.constructor = UserError;