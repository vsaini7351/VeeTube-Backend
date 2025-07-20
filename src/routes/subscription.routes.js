import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    
    subscriptionStatus,
    
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();


// Get all subscribers for a channel (public or admin)
router.get("/c/:channelId", getUserChannelSubscribers);

// Toggle current user's subscription to a channel
router.post("/c/:channelId/toggle-subscription", verifyJWT, toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

router.route("/c/:channelId/subscription-status").get(verifyJWT,subscriptionStatus)


export default router