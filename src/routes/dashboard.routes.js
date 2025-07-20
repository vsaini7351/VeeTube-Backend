import { Router } from 'express';
import {
    getChannelStats,
    getChannelTweets,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();


router.route("/:channelId/stats").get(getChannelStats);
router.route("/:channelId/videos").get(getChannelVideos);
router.route("/:channelId/tweets").get(getChannelTweets)

export default router