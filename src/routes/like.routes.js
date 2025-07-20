import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedTweets,
    videoLikeStatus,
    commentLikeStatus,
    tweetLikeStatus,
    getVideoLikes,
    getTweetLikes,
    getCommentLikes,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
 
router.route("/v/:videoId").post(verifyJWT,toggleVideoLike).get(verifyJWT,videoLikeStatus);
router.route("/v/:videoId/likes").get(getVideoLikes)
router.route("/c/:commentId").post(verifyJWT,toggleCommentLike).get(verifyJWT,commentLikeStatus);
router.route("/c/:commentId/likes").get(getCommentLikes)
router.route("/t/:tweetId").post(verifyJWT,toggleTweetLike).get(verifyJWT,tweetLikeStatus);
router.route("/t/:tweetId/likes").get(getTweetLikes)
router.route("/videos").get(verifyJWT,getLikedVideos);
router.route("/tweets").get(verifyJWT,getLikedTweets)

export default router