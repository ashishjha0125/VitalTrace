const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileSchema = Joi.object({
  name: Joi.string(),
  age: Joi.number().integer().min(1).max(120),
  medicalHistory: Joi.string().allow('', null)
});

const sessionSchema = Joi.object({
  startTime: Joi.number().required(),
  duration: Joi.number().required(),
  avgBpm: Joi.number(),
  totalSamples: Joi.number(),
  quality: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor')
});

const ecgSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  data: Joi.array().items(Joi.number()).required(),
  sampleRate: Joi.number().default(200),
  duration: Joi.number().required()
});

const analysisSchema = Joi.object({
  analysisResults: Joi.array().items(Joi.any()).required(),
  rawMetrics: Joi.object().required(),
  userAge: Joi.number(),
  medicalHistory: Joi.string().allow('', null)
});

module.exports = {
  registerSchema,
  loginSchema,
  profileSchema,
  sessionSchema,
  ecgSchema,
  analysisSchema
};
