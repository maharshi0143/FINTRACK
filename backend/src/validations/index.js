// Validation middleware
// Usage: router.post('/path', validate({ name: 'required', email: 'required|email' }), handler)
// Rules: required, email, number, positive, min:X, max:X, password
const { validate } = require('../middlewares/validate.middleware');

module.exports = { validate };
