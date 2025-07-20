import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validate channelId
  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(404, "Enter a valid channel ID");
  }

  const subscriberId = req.user._id;

  let subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (subscription) {
    await Subscription.findByIdAndDelete(subscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  } else {
    subscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, subscription, "Subscribed successfully"));
  }
});

const subscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(404, "Enter a valid channel ID");
  }

  const subscriberId = req.user._id;

  const subscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  const isSubscribed = !!subscription; // boolean me convert kar dega

  return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed }, isSubscribed ? "Subscribed" : "Not Subscribed"));
});


// controller to return subscriber list of a channel


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(404, "Invalid Channel id");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },// lookup se array return hoga to isko hatane ke liye unwind use kar liya
    {
      $unwind: "$subscriber",
    } 
    
    
   
  ]);

  if (!subscribers) {
    throw new ApiError(500, "Unable to fetch data");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers.map(s => s.subscriber), "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(404, "Invalid Channel id");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },// lookup se array return hoga to isko hatane ke liye unwind use kar liya
    {
      $unwind: "$channel",
    } 
    
    
   
  ]);

  if (!channels) {
    throw new ApiError(500, "Unable to fetch data");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channels.map(c => c.channel), "channels fetched successfully"));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    subscriptionStatus
    
}