"use strict"
/* -------------------------------------------------------
   | MUSTSEL | NODEJS / EXPRESS |
------------------------------------------------------- */

const User = require('../models/user')
const Token = require('../models/token')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

module.exports = {

    login: async (req, res) => {
        /*
            #swagger.tags = ["Authentication"]
            #swagger.summary = "Login"
            #swagger.description = 'Login with username (or email) and password for get Token and JWT.'
            #swagger.parameters["body"] = {
                in: "body",
                required: true,
                schema: {
                    "username": "test",
                    "password": "1234",
                }
            }
        */

        const { username, email, password } = req.body

        if ((username || email) && password) {
            try {
                const user = await User.findOne({ $or: [{ email }, { username }] })
                
                if (user && await bcrypt.compare(password, user.password)) {
                    if (user.isActive) {
                        // Simple TOKEN:
                        let tokenData = await Token.findOne({ userId: user._id })
                        if (!tokenData) {
                            tokenData = await Token.create({
                                userId: user._id,
                                token: await bcrypt.hash(user._id + Date.now(), 10)
                            })
                        }

                        // JWT:
                        const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_KEY, { expiresIn: '30m' })
                        const refreshToken = jwt.sign({ _id: user._id, password: user.password }, process.env.REFRESH_KEY, { expiresIn: '3d' })

                        // res.send()
                        res.status(200).send({
                            error: false,
                            token: tokenData.token,
                            bearer: { accessToken, refreshToken },
                            user
                        })

                    } else {
                        res.errorStatusCode = 401
                        throw new Error('This account is not active.')
                    }
                } else {
                    res.errorStatusCode = 401
                    throw new Error('Wrong username/email or password.')
                }
            } catch (error) {
                res.status(res.errorStatusCode || 500).send({ error: true, message: error.message })
            }
        } else {
            res.errorStatusCode = 401
            throw new Error('Please enter username/email and password.')
        }
    },

    refresh: async (req, res) => {
        /*
            #swagger.tags = ['Authentication']
            #swagger.summary = 'JWT: Refresh'
            #swagger.description = 'Refresh access-token by refresh-token.'
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    bearer: {
                        refresh: '___refreshToken___'
                    }
                }
            }
        */

            const refreshToken = req.body?.bearer?.refreshToken

        if (refreshToken) {
            jwt.verify(refreshToken, process.env.REFRESH_KEY, async function (err, userData) {
                if (err) {
                    res.errorStatusCode = 401
                    throw err
                } else {
                    const { _id, password } = userData

                    if (_id && password) {
                        const user = await User.findOne({ _id })

                        if (user && await bcrypt.compare(password, user.password)) {
                            if (user.isActive) {
                                // JWT:
                                const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_KEY, { expiresIn: '30m' })

                                res.send({
                                    error: false,
                                    bearer: { accessToken }
                                })

                            } else {
                                res.errorStatusCode = 401
                                throw new Error('This account is not active.')
                            }
                        } else {
                            res.errorStatusCode = 401
                            throw new Error('Wrong id or password.')
                        }
                    } else {
                        res.errorStatusCode = 401
                        throw new Error('Please enter id and password.')
                    }
                }
            })
        } else {
            res.errorStatusCode = 401
            throw new Error('Please enter token.refresh')
        }
    },

    logout: async (req, res) => {
        /*
            #swagger.tags = ["Authentication"]
            #swagger.summary = "Token: Logout"
            #swagger.description = 'Delete token-key.'
        */

        const auth = req.headers?.authorization || null // Token ...tokenKey... // Bearer ...accessToken...
        const tokenKey = auth ? auth.split(' ') : null // ['Token', '...tokenKey...'] // ['Bearer', '...accessToken...']

        let message = null, result = {}

        if (tokenKey) {
            if (tokenKey[0] == 'Token') { // SimpleToken
                result = await Token.deleteOne({ token: tokenKey[1] })
                message = 'Token deleted. Logout was OK.'
            } else { // JWT
                message = 'No need any process for logout. You must delete JWT tokens.'
            }
        }

        res.send({
            error: false,
            message,
            result
        })
    },
}
