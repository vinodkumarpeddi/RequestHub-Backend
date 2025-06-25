import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized! Login Again!" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(tokenDecode.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found!" });
    }

    req.user = user;
    req.rollNumber = user.rollNumber;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default userAuth;