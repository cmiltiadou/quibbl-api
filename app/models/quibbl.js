const mongoose = require('mongoose')
const Schema = mongoose.Schema

const quibblSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		active: {
			type: Boolean,
			default: false
		},
		duration: {
			type: Number,
			default: false
		},
		replies: [{
			type: Schema.Types.ObjectId,
			ref: 'Reply'
		}],
		tags: [{
			type: Schema.Types.ObjectId,
			ref: 'Tag'
		}],
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
	},
	{
		timestamps: true
	}
)

module.exports = mongoose.model('Quibbl', quibblSchema)
