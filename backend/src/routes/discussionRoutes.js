const express = require('express');
const discussionRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
    getDiscussions,
    getReplies,
    createDiscussion,
    toggleUpvote
} = require('../controllers/discussionControl');

discussionRouter.get('/problem/:problemId', userMiddleware, getDiscussions);
discussionRouter.get('/replies/:threadId', userMiddleware, getReplies);
discussionRouter.post('/create', userMiddleware, createDiscussion);
discussionRouter.post('/upvote/:id', userMiddleware, toggleUpvote);

module.exports = discussionRouter;
