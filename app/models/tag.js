const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tagSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true,
            default: 'red'
        },
        quibbls: [{
			type: Schema.Types.ObjectId,
			ref: 'Quibbl'
		}],
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Tag', tagSchema)