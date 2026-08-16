const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    // const authToken = req.cookies?.auth_token;
    // if(!authToken){
    //     return res.status(401).json({
    //         success:false,
    //         message:"Athorization token missing. please provide token"
    //     })
    // }

    const authHeaders = req.headers['authorization'];
    if(!authHeaders || !authHeaders.startsWith('Bearer')){
         return res.status(401).json({
            success:false,
            message:"Athorization token missing. please provide token"
        })
    }

    const token = authHeaders.split(' ')[1];

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({
            success:false,
            message:"Invalid or exprired token !"
        });
    }
}

module.exports = authMiddleware;