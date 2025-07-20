import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }

    const user=req.user._id

    let like = await Like.findOne({
    likeable: videoId,
    onModel: "Video",
    likedBy: user
});

    if (like) {
        await Like.findByIdAndDelete(like._id);
        return res
          .status(200)
          .json(new ApiResponse(200, null, "Unliked successfully"));
      } 
      
      else {
        like = await Like.create({likeable:videoId,
        onModel:"Video",
        likedBy:user
    });
        return res
          .status(200)
          .json(new ApiResponse(200, like, "liked successfully"));
      }
    

})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(404, "Invalid commentId");
  }

  const user = req.user._id;

  let like = await Like.findOne({
    likeable: commentId,
    onModel: "Comment",
    likedBy: user
  });

  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked successfully"));
  } else {
    like = await Like.create({
      likeable: commentId,
      onModel: "Comment",
      likedBy: user
    });
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(404, "Invalid tweetId");
  }

  const user = req.user._id;

  let like = await Like.findOne({
    likeable: tweetId,
    onModel: "Tweet",
    likedBy: user
  });

  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked successfully"));
  } else {
    like = await Like.create({
      likeable: tweetId,
      onModel: "Tweet",
      likedBy: user
    });
    return res
      .status(200)
      .json(new ApiResponse(200, like, "Liked successfully"));
  }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const user=req.user._id

    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

     const skip = (page - 1) * limit;

    const videos= await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(user),
                onModel:"Video"

            }
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
            $lookup:{
                from: "videos", // collection name in MongoDB
                localField: "likeable",
                foreignField: "_id",
                as: "video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1 
                                    }// as humne owner ke ander sari fields ni chahiye thi
                                }
                            ]
                        }
                    },
                    {
                        $unwind:"$owner"
                    }
                ]

            }
        },
        {
            $unwind:"$video"
        },
        {
            $project: {
                _id: 1,
                likeable: 1,
                createdAt: 1,
                updatedAt: 1,
                "video._id": 1,
                "video.thumbnail": 1,
                "video.videoFile": 1,
                "video.title":1,
                "video.duration":1,
                "video.views": 1,
                "video.owner":1,
                "video.createdAt":1,
                "video.description":1

            }
        }
    ])

    

    return res.status(200).json(
  new ApiResponse(200, {videos,page}, videos.length > 0 ? "Liked videos fetched successfully!" : "No liked videos!")
);
})

const getLikedTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const likedTweets = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        onModel: "Tweet"
      }
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
        from: "tweets",
        localField: "likeable",
        foreignField: "_id",
        as: "tweet"
      }
    },
    {
      $unwind: "$tweet"
    },
    {
      $lookup: {
        from: "users",
        localField: "tweet.owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $unwind: "$owner"
    },
    {
      $project: {
        _id: "$tweet._id",
        content: "$tweet.content",
        createdAt: "$tweet.createdAt",
        updatedAt: "$tweet.updatedAt",
        owner: {
          _id: "$owner._id",
          username: "$owner.username",
          fullName: "$owner.fullName",
          avatar: "$owner.avatar"
        }
      }
    }
  ]);

  const totalLikedTweets = await Like.countDocuments({
    likedBy: userId,
    onModel: "Tweet"
  });

  return res.status(200).json(
    new ApiResponse(200, {
      tweets: likedTweets,
      page,
      limit,
      totalLikedTweets,
      totalPages: Math.ceil(totalLikedTweets / limit)
    }, "Liked tweets fetched successfully")
  );
});


const videoLikeStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const user = req.user._id;

  const like = await Like.findOne({
    likeable: videoId,
    onModel: "Video",
    likedBy: user,
  });

  return res.status(200).json(
    new ApiResponse(200, { liked: !!like }, "Video like status fetched")
  );
});

const commentLikeStatus = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const user = req.user._id;

  const like = await Like.findOne({
    likeable: commentId,
    onModel: "Comment",
    likedBy: user,
  });

  return res.status(200).json(
    new ApiResponse(200, { liked: !!like }, "Comment like status fetched")
  );
});

const tweetLikeStatus = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const user = req.user._id;

  const like = await Like.findOne({
    likeable: tweetId,
    onModel: "Tweet",
    likedBy: user,
  });

  return res.status(200).json(
    new ApiResponse(200, { liked: !!like }, "Tweet like status fetched")
  );
});

const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const likeCount = await Like.countDocuments({
    likeable: new mongoose.Types.ObjectId(videoId),
    onModel: "Video"
  });

  return res.status(200).json(
    new ApiResponse(200, { likeCount }, "Total likes on video fetched")
  );
});

const getTweetLikes = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const likeCount = await Like.countDocuments({
    likeable: new mongoose.Types.ObjectId(tweetId),
    onModel: "Tweet"
  });

  return res.status(200).json(
    new ApiResponse(200, { likeCount }, "Total likes on tweet fetched")
  );
});

const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const totalLikes = await Like.countDocuments({
    likeable: commentId,
    onModel: "Comment",
  });

  return res.status(200).json(
    new ApiResponse(200, { totalLikes }, "Total comment likes fetched")
  );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets,
    videoLikeStatus,
    commentLikeStatus,
    tweetLikeStatus,
    getTweetLikes,
    getVideoLikes,
    getCommentLikes
}