const { authLimiter, apiLimiter, skillsLimiter, requestLimiter } = require('../middleware/rateLimit');

describe('Rate Limit Configuration', () => {
    it('should have all limiters defined', () => {
        expect(authLimiter).toBeDefined();
        expect(apiLimiter).toBeDefined();
        expect(skillsLimiter).toBeDefined();
        expect(requestLimiter).toBeDefined();
    });
    
    // We can't easily test the rate limit values without inspecting internal properties which is brittle,
    // but we can ensure they are functions (middleware).
    it('should export middleware functions', () => {
        expect(typeof authLimiter).toBe('function');
        expect(typeof requestLimiter).toBe('function');
    });
});
