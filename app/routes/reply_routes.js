const express = require('express')
const router = express.Router()
const passport = require('passport')
const Reply = require('../models/reply')
const Quibbl = require('../models/quibbl')
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

const sanitizeHtml = require('sanitize-html')


// get/index route for all Replies of current user
router.get('/replies', requireToken, (req, res, next) => {
    // req.body.reply.contributor = req.user.id
    Reply.find({ owner: req.user.id })
        .then(handle404)
        .then(foundReplies => {
            return foundReplies.map(reply => reply.toObject())
        })
        .then(foundReplies => res.status(200).json({ foundReplies }))
        .catch(next)
})

// get/index route for all Replies to a specific quibbl
router.get('/:quibblId/replies', (req, res, next) => {
    Reply.find({ quibbl: req.params.quibblId })
        .populate('owner', ['userName'])
        .then(handle404)
        .then(foundReplies => {
            return foundReplies.map(reply => reply.toObject())
        })
        .then(foundReplies => res.status(200).json({ foundReplies }))
        .catch(next)
})

// post route to add an reply
router.post('/:quibblId/replies', requireToken, (req, res, next) => {
    // set contributor of reply to be the current user 
    req.body.reply.contributor = req.user.id
    // set quibbl of reply to be the quibbl id from the url param
    req.body.reply.quibbl = req.params.quibblId
    // console.log('is this the quibbl id:', req.body.reply.quibbl)

    // sanitize html for reply.solution
    req.body.reply.reply = sanitizeHtml(req.body.reply.reply)
    const currentUser = req.user

    Reply.create(req.body.reply)
        .then(createdReply => {
            console.log('this is the created reply\n', createdReply)
            // push created quibbl id into the current users reply arr of obj ref
            currentUser.replies.push(createdReply._id)
            // save the current user
            currentUser.save()
            // find current quibbl based on id
            Quibbl.findById(req.params.quibblId)
                .then(foundQuibbl => {
                    // push created reply id into the current quibbls reply arr of obj ref
                    foundQuibbl.replies.push(createdReply._id)
                    // save the current quibbl
                    foundQuibbl.save()
                    res.status(201).json({ reply: createdReply.toObject() })
                })
        })
        .catch(next)
})

// patch route to edit an reply
router.patch('/replies/:id', requireToken, removeBlanks, (req, res, next) => {
    delete req.body.reply.owner

    Reply.findById(req.params.id)
        .then(handle404)
        .then(foundReply => {
            console.log('this if found reply\n', foundReply)
            return foundReply.updateOne(req.body.reply)
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

// delete route for an reply
router.delete('/replies/:replyId', requireToken, (req, res, next) => {
    id = req.params.replyId
    console.log(id)

    Reply.findById(id)
        .then(handle404)
        .then(reply => {
            console.log(reply)
            reply.deleteOne()
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

module.exports = router