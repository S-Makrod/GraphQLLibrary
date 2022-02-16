const { UserInputError, AuthenticationError } = require('apollo-server-express')
const { PubSub } = require('graphql-subscriptions')
const jwt = require('jsonwebtoken')
const Book = require('../models/book')
const Author = require('../models/author')
const User = require('../models/user')
require('dotenv').config()

const JWT_SECRET = process.env.SECRET
const pubsub = new PubSub()

const resolvers = {
    Query: {
        bookCount: () => Book.collection.countDocuments(),
        authorCount: () => Author.collection.countDocuments(),
        allBooks: async (root, args) => {
            if(!args.author && !args.genre) return Book.find({}).populate('author')

            const author = await Author.find({name: args.author})

            if(args.author && args.genre) return Book.find({author: author[0]._id, genres: { $all: [args.genre] }}).populate('author')
            if(args.genre) return Book.find({genres: { $all: [args.genre] }}).populate('author')
            return Book.find({author: author[0]._id}).populate('author')
        },
        allAuthors: () => Author.find({}),
        me: (root, args, context) => context.currentUser
    },
    Author: {
        bookCount: async (root) => {
            const author = await Author.find({name: root.name})
            const books = await Book.find({author: author[0]._id})
            return books.length
        }
    },
    Mutation: {
        addBook: async (root, args, { currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }
            const author = await Author.find({name: args.author})
            if(author.length === 0) {
                const newAuthor = new Author({ name: args.author })
                try {
                    await newAuthor.save()
                } catch (error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
                const book = new Book({ 
                    title: args.title,
                    published: args.published,
                    genres: args.genres,
                    author: newAuthor._id 
                })
                try {
                    await book.save()
                } catch (error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
                const populatedBook = await Book.find({_id: book.id}).populate('author')

                pubsub.publish('BOOK_ADDED', { bookAdded: populatedBook[0] })

                return populatedBook[0]
            } else {
                const book = new Book({ 
                    title: args.title,
                    published: args.published,
                    genres: args.genres,
                    author: author[0]._id 
                })
                try {
                    await book.save()
                } catch (error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
                const populatedBook = await Book.find({_id: book.id}).populate('author')

                pubsub.publish('BOOK_ADDED', { bookAdded: populatedBook[0] })

                return populatedBook[0]
            }
        },
        addAuthor: async (root, args, { currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }
            const author = new Author({ ...args })
            try {
                await author.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }
            return author
        },
        editAuthor: async (root, args, { currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }
            const author = await Author.find({name: args.name})
            if (author.length === 0) {
                return null
            }
        
            author[0].born = args.setBornTo

            try {
                await author[0].save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }
            return author[0]
        },
        login: async (root, args) => {
            const user = await User.findOne({ username: args.username })
        
            if ( !user || args.password !== 'secret' ) {
                throw new UserInputError("wrong credentials")
            }
        
            const userForToken = {
                username: user.username,
                id: user._id,
            }
        
            return { value: jwt.sign(userForToken, JWT_SECRET), favouriteGenre: user.favouriteGenre }
        },
        createUser: async (root, args) => {
            const user = new User({...args})
            console.log(user)
            try {
                await user.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }
            return user
        }
    },
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
        },
    }
}

module.exports = resolvers