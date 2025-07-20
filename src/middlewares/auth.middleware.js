import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT=asyncHandler(async (req,res,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
    //dono me se kisi se le lega token
    // header- payload(data) send along with other data (req,res)
    // in header there is Authorisation header : Bearer <token> 

    if(!token){
        throw new ApiError(401,"Unauthorised access");

    }

    // ab jwt me methods hai verify karne ka 

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);//matlab signature ya secret hatakar jo bacha wo

        } catch (err) {
                            throw new ApiError(401, "Invalid or expired token");
                        }
    const user= await User.findById(decodedToken._id).select("-password -refreshToken") // as humne jwt banate time id dali thi to wo verify karke jo object return karega usme _id par id hogi

    if(!user){
        throw new ApiError(401,"Invalid access Token")
    }

    req.user=user; // jo problem aa rhi thi ki logout kar lo le lekin user kaha se laye wo yaha se aayega

    next();
})