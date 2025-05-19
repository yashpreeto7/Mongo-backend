import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _ ,next) => {
    const token = req.cookies.accessToken || req.body.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

    if(!token) {
       throw new ApiError(401, "Access token is missing");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

       const User =  await User.findById(decodedToken._id).select("-password -refreshToken");
         if(!User) {
              throw new ApiError(404, "User not found");
         }
            req.user = User;



    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }
});

