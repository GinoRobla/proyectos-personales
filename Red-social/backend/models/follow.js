const {Schema, model} = require('mongoose');

const followSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
    },
    followed: {
        type: Schema.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model('Follow', followSchema, 'follows');