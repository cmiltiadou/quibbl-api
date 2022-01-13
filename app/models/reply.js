const mongoose = require('mongoose')
const Schema = mongoose.Schema

// const voteSchema = new mongoose.Schema({
//     voters: [{
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//     }],    
// })


const replySchema = new mongoose.Schema(
    {
        reply: {
            type: String,
            required: true
        },
        bestAnswer: {
            type: Boolean,
            default: false
        },
        votes: [{
            type: String,
        }],
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        quibbl: {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Reply', replySchema)