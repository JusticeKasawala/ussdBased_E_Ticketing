//.JWT.js

const {sign , verify} = require('jsonwebtoken');
const createTokens = (user) =>{
    const accessToken = sign({username: user.username,id: user.id,role : user.role},
    process.env.JWT_SECRET
    //expiration not added ,, it will be added when adding refresh token
    );

    return accessToken;
};
// midleware to validate tolen
const validateToken = (req, res, next) =>{
    const accessToken = req.cookies["access-token"]
//chek if user has token in cookie
if (!accessToken) {
        return res.status(401).json({ error: 'user not authenticated' });
      }
//check if token is valid (check the token  and secret,,, expiry will do later)
try{
    const validToken = verify(accessToken,process.env.JWT_SECRET)
    //verify token
    if (validToken){
       req.user = validToken ;
       // move forward with our request
      next ();
    }
}
catch(err){
    return res.status(401).json({ error: 'Invalid token' });
}

};

module.exports = {createTokens, validateToken};
