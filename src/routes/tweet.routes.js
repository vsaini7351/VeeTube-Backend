import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getTweetById,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();


router.route("/").post(verifyJWT,createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").get(getTweetById).patch(verifyJWT, updateTweet).delete(verifyJWT,deleteTweet);
//yaha konsa http method lagayenge usse decide hoga ki patch karega ya delete do dono chizo ki functionality ek me hi likh di
export default router