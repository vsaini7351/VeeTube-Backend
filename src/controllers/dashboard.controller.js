import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const {channelId}=req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(404,"Invalid Channel Id")
    }

    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


    //things to get- 1. user- username,avatar,fullName,coverImage,
    //               2. subscription - subscribers , no of channels subscribedTo 
    //               3. Video- total no of videos , total no of views on videos              


    const user=await User.findById(channelId)
    if(!user){
        throw new ApiError(404,"No Such Channel exists")
    }

   const subscribers = await Subscription.countDocuments({ channel: channelId });
const subscribedTo = await Subscription.countDocuments({ subscriber: channelId });

    const videos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        count: { $sum: 1 }
      }
    }
  ]); 

//    videos=[{
//            id:null,
//              totalView: x,
//              count:y}]

      const tweets = await Tweet.countDocuments({ owner: channelId });

    const Info={
        username:user.username,
        avatar:user.avatar,
        fullName:user.fullName,
        coverImage:user.coverImage,
        subscribers: subscribers,
        subscribedTo:subscribedTo,
        noOfVideos: videos[0]?.count ||0,
        totalViews: videos[0]?.totalViews|| 0,
         noOfTweets: tweets
    }

    

return res.status(200)
.json(new ApiResponse(200,Info,"Channel Stats Fetched Successfully!"))



})

const getChannelVideos = asyncHandler(async (req, res) => {
     let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

     const skip = (page - 1) * limit;

    const {channelId}=req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(404,"Invalid Channel Id")
    }

    const videos = await Video.aggregate([
  {
    $match: { owner: new mongoose.Types.ObjectId(channelId) }
  },
  {
    $sort: { createdAt: -1 }
  },
  {
    $skip: skip
  },
  {
    $limit: limit
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner"
    }
  },
  {
    $unwind: "$owner"
  },
  {
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      isPublished: 1,
      createdAt: 1,
      updatedAt: 1,
      "owner._id": 1,
      "owner.username": 1,
      "owner.fullName": 1,
      "owner.avatar": 1
    }
  }
]);

const totalVideos = await Video.countDocuments({ owner: channelId });
    
    return res.status(200)
    .json(new ApiResponse(200,{videos,page,limit,count: videos.length,totalVideos},"Videos Fetched successfully"))

})

const getChannelTweets= asyncHandler(async(req,res)=>{
    //TODO: Get all the tweets done by the channel

    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

     const skip = (page - 1) * limit;

    const {channelId}=req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(404,"Invalid Channel Id")
    }

    const tweets= await Tweet.aggregate([
        {
            $match:{owner:new mongoose.Types.ObjectId(channelId)}
        },
        {
            $sort:{createdAt:-1}
        },
        {
            $skip:skip
        },
        {
            $limit:limit
        },
        {
             $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
                    }
        },
  {
    $unwind: "$owner"
  },
  {
    $project: {
      content: 1,
      createdAt: 1,
      updatedAt: 1,
      "owner._id": 1,
      "owner.username": 1,
      "owner.fullName": 1,
      "owner.avatar": 1
    }
  }
    ])

    const totalTweets = await Tweet.countDocuments({ owner: channelId });
    
    return res.status(200)
    .json(new ApiResponse(200,{tweets,page,limit,count: tweets.length,totalTweets},"Tweets Fetched successfully"))

})

export {
    getChannelStats, 
    getChannelVideos,
    getChannelTweets
    }