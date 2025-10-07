import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  password: Joi.string().required().min(4).max(8).pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]{4,8}$')).messages({
    'string.pattern': 'Password must be at least 4 characters long and contain only letters and numbers',
    'string.empty': 'Password is a required field'
  }),
  countryCode: Joi.string().required().messages({
    'string.empty': 'Country code is a required field'
  }),
  phoneNumber: Joi.string().required().messages({
    'string.empty': 'Phone number is a required field'
  })
});

export { signupSchema };
