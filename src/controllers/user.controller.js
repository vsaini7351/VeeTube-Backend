import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { deleteImageOnCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'
import { upload } from '../middlewares/multer.middleware.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import {Video} from '../models/video.model.js'

import {v2 as cloudinary} from 'cloudinary'

const generateAccessAndRefreshToken= async(userId)=>{

    try{
    const user= await User.findById(userId)

    const accessToken = await user.accessTokenGenerator(); // is user ka method hai to ese call karenge

    
    const refreshToken = await user.refreshTokenGenerator();

    // ab hume user me jake refreshToken update bhi to karna hai

    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false})//validateBeforeSave:false isliye kara kyoki agar ye nhi karte to password wagera dobara mangta 

    return {accessToken,refreshToken}
    }
    catch(error){
        
        throw new ApiError(500,"Something went's wrong unable to generate access and refresh token!");
    }
} // function bana liya taki baar baar use kar paye



const registerUser= asyncHandler(async (req,res)=>{
    //get userDetails from frontend
    const {username,email,fullName,password}=req.body
    //validation- not empty
    if([username,email,fullName,password].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"fields can't be empty")
    }
    
    //authorisation- user already exist
    const existedUser= await User.findOne({

    $or:[{ username },{ email }]

    })

    if(existedUser){
        throw new ApiError(409,"user with username or email already exist!")
    }

    //check for images,check for avatar

    const avatarLocalPath= req.files?.avatar[0]?.path;
    
    let coverImageLocalPath=null;
     
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath= req.files.coverImage[0].path;} // Array.isArray wali line dalni bhi zaruri hai

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required!")
    }

    // upload them to cloudinary,avatar check
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(500,"Reupload avatar file!")
    }
    // create user object-create entry in db

    const user= await User.create({
                    fullName,
                    avatar:avatar.url,
                    coverImage:coverImage?.url || "",
                    email,
                    password,
                    username:username.toLowerCase()

                })

    
    

    // remove password and refresh token field from response & check for user creation
    const createdUser=await User.findById(user._id)?.select("-password -refreshToken") // apne app _id add ho jayega jab bhi user create hoga
    // .select se jis field ke aage - likha hai wo hat jayegi response me se 

    if(!createdUser){
        throw new ApiError(500,"Something went's wrong while registering the user!")
    }

    
    //return response

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered successfully!")
    )


})

const loginUser=asyncHandler(async (req,res)=>{
    // req.body se username and password le lenge
    
    const {email, username,password}= req.body

    //check karenge kuch empty to nhi hai
    if(!username && !email){
        throw new ApiError(400,"username or email is required!");
    }
    
    if(!password){
        throw new ApiError(400,"Password is required!")
    }
    // dekhenge user with that username exist or not
    const user=await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(401,"User not found!");
    }
    //password check
    const check = await user.isPasswordCorrect(password);
    if(!check){
        throw new ApiError(409,"Password doesn't match!")
    }
    // refresh token and access token
    const {refreshToken,accessToken}= await generateAccessAndRefreshToken(user._id);

    const loggedInUser=await User.findById(user._id)?.select("-password -refreshToken")

    
    const options={
        httpOnly:true,
        secure:true
    } // isse frontend par koi changes nhi kar payenge jo server hai whi kar payega,ise sirf read kar payenge frontend par

    //as cookie-parser hai to hum directly cookie bhej sakte hai
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully!")
    )
    
})

const logoutUser=asyncHandler(async(req,res)=>{
    //dekho yaha dikkat ye aa rhi thi ki logout to kar de lekin user._id kaha se le iske liye humne auth.middleware banaya
    //delete refresh token
await User.findByIdAndUpdate(req.user._id,{$set:{refreshToken:undefined}},{new:true})  //new:true ->taki jo response aaye usme updated values ho
//$unset ka bhi use kar sakte hai

//clear cookies

 const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"User logged out successfully!"))

})

const refreshTheAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken=req.cookies?.refreshToken|| req.body?.refreshToken;
    

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request");
    }

    const decodedIncomingRefreshToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    if(!decodedIncomingRefreshToken){
        throw new ApiError(402,"Refresh Token expired or not available!")
    }

    const user= await User.findById(decodedIncomingRefreshToken._id)

    if(!user){
        throw new ApiError(401,"invalid refresh token");
    }

    if(user.refreshToken!==incomingRefreshToken){
        throw new ApiError(400,"Refresh Token is expired or used");
    }

    const options={
        httpOnly:true,
        secure:true
    }

    const accessToken = await user.accessTokenGenerator();

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",incomingRefreshToken,options)
    .json(
        new ApiResponse(200,{
            accessToken,refreshToken:incomingRefreshToken
        },"access token refreshed")
    )



})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
   const {oldPassword,newPassword,confirmPassword}=req.body// form se le lenge

   if(!oldPassword || !newPassword || !confirmPassword){
    throw new ApiError(400,"All fields are required!");

   }

   if(confirmPassword!==newPassword){
    throw new ApiError(401,"Confirm password don't match with new password")
   }

   const user=await User.findById(req.user._id);

   const oldPasswordCheck = await user.isPasswordCorrect(oldPassword);

   if(!oldPasswordCheck){
    throw new ApiError(401,"Old password didn't match!");
   }

   user.password=newPassword;
   user.save({validateBeforeSave:false})// save hone se phele bcrypt ho jayega

   return res
   .status(200)
   .json(
    new ApiResponse(200,{},"Password updated successfully!")
   )
})

const getCurrentUser =asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

const updateUserDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName && !email){
        throw new ApiError(400,"At least one field is required!");
    }

    const updates = {};

    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email; // as we only want to update that thing which is given

    const user= await User.findByIdAndUpdate(req.user?._id,{
        $set:updates
    },{
        new:true
    }).select("-password -refreshToken") // new true karne se jo response aayega usme updated values hongi


    return res.status(200)
    .json(new ApiResponse(200,user,"Accounts details updates successfully!"))

})

const updateAvatar=asyncHandler(async(req,res)=>{
    // do middleware lagenge , verifyJwt , multer
    const avatarLocalPath=req.file?.path // register karate samay humne middleware me bhi fields liya tha isliye yaha files leke phir array ka 1st element liya tha par yaha par jarurat nhi hai

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload file!")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500,"Image not uploaded on database!")
    }

    // dekho ye file update kar rhe hai to delete bhi to karni padegi na
    const userinitially=await User.findById(req.user?._id);

    if (userinitially?.avatar) {
  await deleteImageOnCloudinary(userinitially.avatar);
}

   const user= await User.findByIdAndUpdate(req.user?._id,{
        $set:{avatar:avatar.url}
    },{new:true}).select("-password -refreshToken")


     // user.avatar = https://res.cloudinary.com/dkiiiqwfi/image/upload/v1751969801/ngtzves3t2mrzyrl9wia.jpg // kuch esa url hoga par 
    //hume delete karne kel liye sirf ngtzves3t2mrzyrl9wia ye chahiye jise cloudinary id kheta hai v1751969801 iske bad ki chiz chahiye hoti hai agar wo kisi folder me hoti to bad ka folder bhi dalte id me

    //to ise nikalne ke liye 

    
     

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully!"))


    //To do- cloudinary par se bhi ye image hatani hai

})

const updateCoverImage=asyncHandler(async(req,res)=>{
    // do middleware lagenge , verifyJwt , multer
    const coverImageLocalPath=req.file?.path // register karate samay humne middleware me bhi fields liya tha isliye yaha files leke phir array ka 1st element liya tha par yaha par jarurat nhi hai

    if(!coverImageLocalPath){
        throw new ApiError(400,"Please upload file!")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(500,"Image not uploaded on database!")
    }

     const userinitially=await User.findById(req.user?._id);

    if (userinitially?.coverImage) {
  await deleteImageOnCloudinary(userinitially.coverImage);
    }

    const user= await User.findByIdAndUpdate(req.user?._id,{
        $set:{coverImage:coverImage.url}
    },{new:true}).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200,user,"coverImage updated successfully!"))

})

const getUserChannelProfile =asyncHandler(async(req,res)=>{

    const {username}= req.params // ye bhi useParams jaisa hi hai /:username  likh denge url me to wo wala username aa jayega jaisa channel ka username dalke channel aata hai na

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel= await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                // dekho user wali document to hai hi ab hum chahte hai subscribers pata karna us channel ke to subscription model 
                //me jayenge aur dekhnge ki us channel ke kitne user subscribed hai

                from: "subscriptions", //  subscriptions models se chahiye, yaha mongodb me jaise document store hoga wo likhenge
                localField: "_id", // jiske bases par hum search karna chahte hai wo field user me kis nam se  hai to hum channel ki id se search karna chahte hai
                foreignField: "channel", // subscription models me jitne bhi hai unke channel===_id ho to wo chahiye
                as : "subscribers",  // jo response aayega useme .subscribers karenge to ek array aayaga
            }
        },
        {
            
            $lookup:{
                //ab hume chahiye kin kin ko humne subscribe kar rakha hai

                from: "subscriptions", 
                localField: "_id", 
                foreignField: "subscriber", 
                as : "subscribed",  // jo response aaya usme .subscribed karenge to jin jinko subscribe kar rakha hai unka array milega
            }
        },

        //ab hum chahte hai field(jaise username,password etc) add karna 
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers" //as subscribers ek field banayi thi jisme ek array tha isliye field hone ke karan '$' lagana pada
                },
                channelsSubscribedCount:{
                    $size: "$subscribed"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                } // taki subscribe karne ka button red rakhna hai ya grey

            }
        },
        {
            // ab hum chahte hai ki sari values na bheje selected values hi bheje to uske liye ya selected values hi project kare :

            $project:{
                fullName:1, // jis jis ko bhejna hai uske aage 1 likh do
                username:1,
                subscriberCount:1,
                isSubscribed:1,
                channelsSubscribedCount:1,
                avatar:1,
                coverImage:1,

            }

        }

    ])

    //to dekho ye jo channel hai ye ek array hoga par kyoki ek hi user match kara hoga first me to ek hi element hoga usme
    if(!channel?.length){
        throw new ApiError(404,"Channel not exist!");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"Chanel Info fetched successfully!"))
})

// const getWatchHistory=asyncHandler(async(req,res)=>{
//     const { page = 1, limit = 10 } = req.query;

//   const skip = (parseInt(page) - 1) * parseInt(limit);

//     const user= await User.aggregate([
//         {
//             $match: {
//                         _id: new mongoose.Types.ObjectId(req.user._id) //theek hai ye , yaha Schema nhi aayega
//                     }
//         },
//         {
//             $lookup:{
//                 from:"videos",
//                 localField:"watchHistory",
//                 foreignField:"_id",
//                 as:"watchHistory",
//                 pipeline:[
//                     {
//                         $lookup:{
//                             from:"users",
//                             localField:"owner",
//                             foreignField:"_id",
//                             as:"owner",
//                             pipeline:[
//                                 {
//                                     $project:{
//                                         fullName:1,
//                                         username:1,
//                                         avatar:1 
//                                     }// as humne owner ke ander sari fields ni chahiye thi
//                                 }
//                             ]
//                         }
//                     },
//                     //ab dekho iske bad watchHistory me array of array jayega videos ka par hum chahte hai direct array of videos jaye isliye ek aur pipeline lagadenge
//                     {
//                         $addFields: {
//                             owner: {
//                                 $first:"$owner" // yaha first matlab array ka first element
//                             }
//                         }
//                     } // is second pipeline se frontend wale ko sahuliyat ho jayegi ki watchHistory me direct array mil jayega videos ka
//                 ] // ese further down jitni pipeline chahe utni laga sakte hai

//             }
//         },
//         //using slice for pagination
//          {
//       $addFields: {
//         watchHistory: {
//           $slice: ["$watchHistory", skip, parseInt(limit)],
//         },
//       },
//     },
//     ])

//     return res
//     .status(200)
//     .json(new ApiResponse(200,user[0].watchHistory,"watch History fetched successfully!"))


// }) // is wale me videos ordre me nhi aayengi

const getWatchHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // STEP 1: Get user's watchHistory array (just IDs)
  const user = await User.findById(req.user._id).select("watchHistory");
  const historyIds = user.watchHistory || [];

  // STEP 2: Apply pagination
  const paginatedIds = historyIds.slice(skip, skip + parseInt(limit));

  // STEP 3: Fetch full video docs for those IDs
  const videos = await Video.find({ _id: { $in: paginatedIds } })
    .populate({
      path: "owner",
      select: "fullName username avatar",
    })
    .lean();

  // STEP 4: Maintain order based on original paginatedIds
  const videoMap = new Map(videos.map((v) => [v._id.toString(), v]));

  const orderedVideos = paginatedIds
    .map((id) => videoMap.get(id.toString())) // put videos in correct order
    .filter(Boolean); // remove any nulls (just in case)

  return res.status(200).json(
    new ApiResponse(
      200,
      orderedVideos,
      "Watch history fetched successfully!"
    )
  );
});


export {registerUser,loginUser,logoutUser,refreshTheAccessToken,changeCurrentPassword,getCurrentUser,updateUserDetails,updateAvatar,updateCoverImage,getUserChannelProfile,getWatchHistory}

