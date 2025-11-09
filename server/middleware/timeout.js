const timeout = (seconds = 30) => {
  return (req, res, next) => {
    req.setTimeout(seconds * 1000, () => {
      res.status(408).json({
        success: false,
        errors: ['Request timeout']
      });
    });
    
    res.setTimeout(seconds * 1000, () => {
      res.status(408).json({
        success: false,
        errors: ['Response timeout']
      });
    });
    
    next();
  };
};

module.exports = timeout;
