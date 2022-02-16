const { gql } = require('apollo-server-express')

const typeDefs = gql`
    type User {
        username: String!
        favouriteGenre: String!
        id: ID!
    }
    
    type LoggedUserDetails {
        value: String!
        favouriteGenre: String!
    }

    type Book {
        title: String!
        published: Int!
        author: Author!
        genres: [String!]!
        id: ID!
    }

    type Author {
        name: String!
        born: Int
        bookCount: Int!
        id: ID!
    }

    type Query {
        bookCount: Int!
        authorCount: Int!
        allBooks(author: String, genre: String): [Book!]!
        allAuthors: [Author!]!
        me: User
    }

    type Mutation {
        addBook(
            title: String!
            published: Int!
            author: String!
            genres: [String!]!
        ): Book
        addAuthor(
            name: String!
            born: Int
        ): Author
        editAuthor(
            name: String!
            setBornTo: Int!
        ): Author
        createUser(
            username: String!
            favouriteGenre: String!
        ): User
        login(
            username: String!
            password: String!
        ): LoggedUserDetails
    }  

    type Subscription {
        bookAdded: Book!
    } 
`

module.exports = typeDefs