const express = require('express')
const router = express.Router()
const passport = require('passport')
const Tag = require('../models/tag')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404

// may add requireToken in the future
// const requireToken = passport.authenticate('bearer', { session: false })




// get/index route for all tags
router.get('/tags', (req, res, next) => {
    Tag.find()
        .then(handle404)
        .then(foundTags => {
            return foundTags.map(tag => tag.toObject())
        })
        .then(foundTags => res.status(200).json({ foundTags }))
        .catch(next)
})

router.post('/tags', (req, res, next) => {

	Tag.create(req.body.tag)
		// respond to succesful `create` with status 201 and JSON of new "tag"
		.then((tag) => {
		
			res.status(201).json({ tag: tag.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})
// patch route to edit a tag
router.patch('/tags/:id', (req, res, next) => {
   
    Tag.findById(req.params.id)
        .then(handle404)
        .then(foundTag => {
            console.log('this if found reply\n', foundTag)
            return foundTag.updateOne(req.body.tag)
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

// delete route for an tag
router.delete('/tags/:id', (req, res, next) => {
    Tag.findById(re.params.id)
        .then(handle404)
        .then(tag => {
            console.log(tag)
            tag.deleteOne()
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

module.exports = router