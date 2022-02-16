import React, { useEffect, useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { useQuery, useApolloClient, useSubscription } from '@apollo/client'
import LoginForm from './components/LoginForm'
import { BOOK_ADDED, ALL_BOOKS, ALL_AUTHORS } from './queries'
var _ = require('lodash');

const Notify = ({errorMessage}) => {
    if ( !errorMessage ) {
      return null
    }
    return (
      <div style={{color: 'red'}}>
        {errorMessage}
      </div>
    )
}

const App = () => {
    const res1 = useQuery(ALL_BOOKS)
    const res2 = useQuery(ALL_AUTHORS)
    const [page, setPage] = useState('authors')
    const [token, setToken] = useState(null)
    const client = useApolloClient()
    const [errorMessage, setErrorMessage] = useState(null)

    const updateCacheWithBook = (addedBook) => {
        const includedIn = (set, object) => set.map(b => b.id).includes(object.id)  
        const dataInStore = _.cloneDeep(client.readQuery({ query: ALL_BOOKS }))
        if (!includedIn(dataInStore.allBooks, addedBook)) {
            dataInStore.allBooks.push(addedBook)
            client.writeQuery({
                query: ALL_BOOKS,
                data: { allBooks: dataInStore.allBooks }
            })
            updateCacheWithAuthor(addedBook.author)
        }   
        console.log(_.cloneDeep(client.readQuery({ query: ALL_BOOKS })))
    }

    const updateCacheWithAuthor = (addedAuthor) => {
        const includedIn = (set, object) => set.map(a => a.id).includes(object.id)  
        const dataInStore = _.cloneDeep(client.readQuery({ query: ALL_AUTHORS }))
        if (!includedIn(dataInStore.allAuthors, addedAuthor)) {
            addedAuthor.born = null
            addedAuthor.bookCount = 1
            dataInStore.allAuthors.push(addedAuthor)
            client.writeQuery({
                query: ALL_AUTHORS,
                data: { allAuthors: dataInStore.allAuthors }
            })
        }   
    }

    useSubscription(BOOK_ADDED, {
        onSubscriptionData: ({ subscriptionData }) => {
            const addedBook = subscriptionData.data.bookAdded
            window.alert(`The Book ${addedBook.title} was added!`)
            updateCacheWithBook(addedBook)
        }
    })

    useEffect(() => {
        const tok = localStorage.getItem('library-user-token')
        if(tok) {
            setToken(tok)
        }
    }, [])

    const logout = () => {
        setToken(null)
        localStorage.clear()
        client.resetStore()
        setPage('authors')
    }

    const notify = (message) => {
        setErrorMessage(message)
        setTimeout(() => {
          setErrorMessage(null)
        }, 5000)
    }

    if(!token) {
        return (
            <div>
                <div>
                    <button onClick={() => setPage('authors')}>authors</button>
                    <button onClick={() => setPage('books')}>books</button>
                    <button onClick={() => setPage('login')}>Login</button>
                </div>
                <Notify errorMessage={errorMessage} />
                <Authors show={page === 'authors'} />
                <Books show={page === 'books'} />
                <LoginForm show={page === 'login'} setPage={setPage} setToken={setToken} setError={setErrorMessage} />
            </div>
        )
    }

    return (
        <div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
                <button onClick={() => setPage('add')}>add book</button>
                <button onClick={logout}>logout</button>
            </div>
            <Notify errorMessage={errorMessage} />
            <Authors show={page === 'authors'} notify={notify} />
            <Books show={page === 'books'} />
            <NewBook show={page === 'add'} notify={notify} updateCacheWithBook={updateCacheWithBook} />
        </div>
    )
}

export default App