const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionSchema = new Schema({
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'discussion',
        default: null
    },
    upvotes: {
        type: [Schema.Types.ObjectId],
        ref: 'user',
        default: []
    }
}, {
    timestamps: true
});

const Discussion = mongoose.model('discussion', discussionSchema);

module.exports = Discussion;
