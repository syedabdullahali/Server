const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "Access denied" });


  jwt.verify(token, process.env.SECRET_KEY, 
    (err, user) => {
      console.log(user)
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  }
);
//  console.log(user._id,"Verify User",token)



//  _id: user._id, email
};
const AdminAuthentication = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "Access denied" });
  jwt.verify(token, process.env.SECRET_KEY, 
    (err, user) => {
      // console.log(user)
      if (user.role === "admin") {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    
  }
);

};


module.exports = {authenticateToken,AdminAuthentication}
