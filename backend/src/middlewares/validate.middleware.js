// Simple manual validation middleware
// Usage: router.post('/path', validate({ name: 'required', email: 'required|email' }), handler)

function validate(fields) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(fields)) {
            const value = req.body[field];
            const ruleList = rules.split('|');

            for (const rule of ruleList) {
                if (rule === 'required' && (value === undefined || value === null || value === '')) {
                    errors.push(`${field} is required`);
                    break;
                }

                if (value !== undefined && value !== null && value !== '') {
                    if (rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(`${field} must be a valid email`);
                    }
                    if (rule === 'number' && isNaN(Number(value))) {
                        errors.push(`${field} must be a number`);
                    }
                    if (rule === 'positive' && Number(value) <= 0) {
                        errors.push(`${field} must be positive`);
                    }
                    if (rule.startsWith('min:') && String(value).length < Number(rule.split(':')[1])) {
                        errors.push(`${field} must be at least ${rule.split(':')[1]} characters`);
                    }
                    if (rule.startsWith('max:') && String(value).length > Number(rule.split(':')[1])) {
                        errors.push(`${field} must not exceed ${rule.split(':')[1]} characters`);
                    }
                    if (rule === 'password') {
                        if (String(value).length < 6) {
                            errors.push(`${field} must be at least 6 characters`);
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0]
            });
        }

        next();
    };
}

module.exports = { validate };
