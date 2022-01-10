// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')
// pull in Mongoose model for quibbls
const Quibbl = require('../models/quibbl')
// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')
// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership
// this is middleware that will remove blank fields from `req.body`, e.g.
// { quibbl: { title: '', text: 'foo' } } -> { quibbl: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })
// instantiate a router (mini app that only handles routes)
const router = express.Router()

// instantiate html sanitizer
const sanitizeHtml = require('sanitize-html')

// INDEX
// GET /quibbls
router.get('/quibbls', (req, res, next) => {
	Quibbl.find()
		.populate('owner', ['userName'])
		.populate('tags', ['description'])
		.then(handle404)
		.then(foundQuibbls => {
			// `quibbls` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return foundQuibbls.map(quibbl => quibbl.toObject())
			// return quibbls.map((quibbl) => quibbl.toObject())
		})
		// respond with status 200 and JSON of the quibbls
		.then(quibbls => res.status(200).json({ quibbls: quibbls }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// get/index route for all quibbls of current user
router.get('/quibbls/user', requireToken, (req, res, next) => {
    // req.body.answer.contributor = req.user.id
    Quibbl.find({ owner: req.user.id })                                             
        .then(handle404)
        .then(foundQuibbls => {
            return foundQuibbls.map(quibbl => quibbl.toObject())
        })
        .then(foundQuibbls => res.status(200).json({ foundQuibbls }))
        .catch(next)
})

// // SHOW
// // GET /quibbls/5a7db6c74d55bc51bdf39793
router.get('/quibbls/:id', (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	quibbl.findById(req.params.id)
		// use the quibblId to populate the corresponding owner
		.populate('owner', ['firstName', 'lastName'])
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "quibbl" JSON
		.then((foundQuibbl) => res.status(200).json({ quibbl: foundQuibbl.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// CREATE
// POST /quibbls
router.post('/quibbls', requireToken, (req, res, next) => {
	// set owner of new quibbl to be current user
	req.body.quibbl.owner = req.user.id
	let currentUser = req.user
	console.log('this is req.user', req.user)

	// sanitize quibbl.description html
	req.body.quibbl.description = sanitizeHtml(req.body.quibbl.description)

	Quibbl.create(req.body.quibbl)
		// respond to succesful `create` with status 201 and JSON of new "quibbl"
		.then((quibbl) => {
			// push created quibbl id into the current users quibbl arr of obj ref
			currentUser.quibbls.push(quibbl._id)
			// save the current user
			currentUser.save()
			res.status(201).json({ quibbl: quibbl.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

// UPDATE
// PATCH /quibbls/5a7db6c74d55bc51bdf39793
router.patch('/quibbls/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.quibbl.owner

	// sanitize quibbl.description html
	req.body.quibbl.description = sanitizeHtml(req.body.quibbl.description)

	Quibbl.findById(req.params.id)
		.then(handle404)
		.then((quibbl) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, quibbl)
			// pass the result of Mongoose's `.update` to the next `.then`
			return quibbl.updateOne(req.body.quibbl)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /quibbls/5a7db6c74d55bc51bdf39793
router.delete('/quibbls/:id', requireToken, (req, res, next) => {
	Quibbl.findById(req.params.id)
		.then(handle404)
		.then((quibbl) => {
			// throw an error if current user doesn't own `quibbl`
			requireOwnership(req, quibbl)
			// delete the quibbl ONLY IF the above didn't throw
			quibbl.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})
module.exports = router