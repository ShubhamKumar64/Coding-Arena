const Discussion = require('../models/discussion');

const getDiscussions = async (req, res) => {
    try {
        const { problemId } = req.params;
        const discussions = await Discussion.find({ problemId, parentId: null })
            .populate('userId', 'firstName')
            .sort({ createdAt: -1 });

        const postsWithReplyCount = await Promise.all(discussions.map(async (post) => {
            const replyCount = await Discussion.countDocuments({ parentId: post._id });
            return {
                ...post._doc,
                replyCount
            };
        }));

        res.status(200).json(postsWithReplyCount);
    } catch (error) {
        res.status(500).send("Error fetching discussions: " + error.message);
    }
};

const getReplies = async (req, res) => {
    try {
        const { threadId } = req.params;
        const replies = await Discussion.find({ parentId: threadId })
            .populate('userId', 'firstName')
            .sort({ createdAt: 1 });

        res.status(200).json(replies);
    } catch (error) {
        res.status(500).send("Error fetching replies: " + error.message);
    }
};

const createDiscussion = async (req, res) => {
    try {
        const { problemId, title, content, parentId } = req.body;
        const userId = req.result._id;

        if (!problemId || !content) {
            return res.status(400).send("Missing required fields (problemId, content)");
        }

        const newPost = await Discussion.create({
            problemId,
            userId,
            title,
            content,
            parentId: parentId || null
        });

        const populated = await newPost.populate('userId', 'firstName');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).send("Error creating discussion: " + error.message);
    }
};

const toggleUpvote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.result._id;

        const post = await Discussion.findById(id);
        if (!post) {
            return res.status(404).send("Discussion post not found");
        }

        const upvoteIndex = post.upvotes.indexOf(userId);
        if (upvoteIndex === -1) {
            post.upvotes.push(userId);
        } else {
            post.upvotes.splice(upvoteIndex, 1);
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).send("Error toggling upvote: " + error.message);
    }
};

module.exports = {
    getDiscussions,
    getReplies,
    createDiscussion,
    toggleUpvote
};
