

export const userValidationSchema = {
    email: {
        in: ['body'],
        isEmail: {
            errorMessage: 'Must be a valid email address'
        },
        normalizeEmail: true
    },
    password: {
        in: ['body'],
        isLength: {
            options: { min: 6 },
            errorMessage: 'Password must be at least 6 characters long'
        },
        notEmpty: {
            errorMessage: 'Password is required'
        }
    }
};