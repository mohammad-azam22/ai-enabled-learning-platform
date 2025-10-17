const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated, proceed to the next middleware/route handler
        return next();
    }
    // User is not authenticated, respond with an error
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
}

module.exports = isAuthenticated;
