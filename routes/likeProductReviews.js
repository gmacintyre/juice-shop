const utils = require('../lib/utils')
const challenges = require('../data/datacache').challenges
const db = require('../data/mongodb')
const insecurity = require('../lib/insecurity')

module.exports = function productReviews () {
  return (req, res, next) => {
    const id = req.body.id
    const user = insecurity.authenticatedUsers.from(req)
    db.reviews.findOne({ _id: id }).then(review => {
      var likedBy = review.likedBy
      if (!likedBy.includes(user.data.email)) {
        db.reviews.update(
          { _id: id },
          { $inc: { likesCount: 1 } }
        ).then(
          result => {
              db.reviews.findOne({ _id: id }).then(review => {
                var likedBy = review.likedBy
                likedBy.push(user.data.email)
                var count = 0
                for (var i = 0; i < likedBy.length; i++) {
                  if (likedBy[i] === user.data.email) {
                    count++
                  }
                }
                if (count > 2 && utils.notSolved(challenges.timingAttackChallenge)) {
                  utils.solve(challenges.timingAttackChallenge)
                }
                db.reviews.update(
                  { _id: id },
                  { $set: { likedBy: likedBy } }
                ).then(
                  result => {
                    res.json(result)
                  }, err => {
                    res.status(500).json(err)
                  })
              }, () => {
                res.status(400).json({ error: 'Wrong Params' })
              })
          }, err => {
            res.status(500).json(err)
          })
      } else {
        res.status(403).json({ error: 'Not allowed' })
      }
    }, () => {
      res.status(400).json({ error: 'Wrong Params' })
    })
  }
}
