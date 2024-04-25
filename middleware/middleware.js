// middleware/roleMiddleware.js

// check if user is  valid 
const is_user = (req, res, next) => {
  if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access forbidden. user privileges required.' });
  }
  next();
};
// check if user is admin , if yes grant them permision
const is_admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden. Admin privileges required.' });
  }
  next();
};

// check if the user is either admin or user , if not any of these , deny access to the resource
const is_user_or_admin = (req , res , next) => {
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden. you are not yet a user of our system.' });
}
next();
}

module.exports = { is_admin, is_user_or_admin,is_user };
