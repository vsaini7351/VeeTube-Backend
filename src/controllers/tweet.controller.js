import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    const { content } = req.body;

    // Check if user is logged in and owner ID is valid
    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError(401, "Invalid or missing user ID. Please log in again.");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required!");
    }

    const tweet = await Tweet.create({
        owner,
        content
    });

    if (!tweet) {
        throw new ApiError(500, "Unable to create tweet at this moment.");
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully!")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId}=req.params
    const owner = userId;

    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
        throw new ApiError(401, "Invalid or missing user ID. Please log in again.");
    }

    const tweets = await Tweet.aggregate([
  {
    $match: {
      owner: new mongoose.Types.ObjectId(owner)  // filter by user
    }
  },
  {
    $sort: { createdAt: -1 } // newest first
  },
  {
    $lookup: {
      from: "users", // collection name in MongoDB (lowercase plural of model name)
      localField: "owner",
      foreignField: "_id",
      as: "owner"
    }
  },
  {
    $unwind: "$owner" // convert array to object
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
]); // optional: latest first

    // Optional: Handle if no tweets found
    if (tweets.length === 0) {
        return res.status(200)
        .json(new ApiResponse(200,[],"No tweets done by user"))
    }

    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully!")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;
    const user = req?.user?._id;

    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to update the tweet");
    }

    let tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== user.toString()) {
        throw new ApiError(403, "You are not allowed to make changes to this tweet");
    }

    tweet.content = content;
    tweet = await tweet.save();

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully!")
    );
});


const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const user = req?.user?._id;

    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    // Fetch and delete in one query
    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: user,
    });

    if (!tweet) {
        // Either tweet doesn't exist or user doesn't own it
        throw new ApiError(403, "You are not allowed to delete this tweet or it doesn't exist");
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet deleted successfully!")
    );
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users", // collection name in MongoDB (lowercase plural of "User")
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner", // turn array into object
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
  ]);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet fetched successfully")
  );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getTweetById
}