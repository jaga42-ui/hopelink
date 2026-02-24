const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  // STRICT RULE: Minimum 6 chars
  password: Joi.string().min(6).required(), 
  phone: Joi.string().required(),
  role: Joi.string().valid('donor', 'receiver', 'admin').default('donor'),
  address: Joi.string().allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    // Return 400 Bad Request with the specific error message
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { validateRegister, validateLogin };