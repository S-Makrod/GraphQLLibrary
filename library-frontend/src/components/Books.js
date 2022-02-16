import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
var _ = require('lodash');

const Books = (props) => {
    const result = useQuery(ALL_BOOKS)
    const [filter, setFilter] = useState('all')
    
    if (!props.show) {
        return null
    }
    if (result.loading)  {
        return <div>loading...</div>
    }

    const handleFilter = (val) => setFilter(val)
    const books = result.data.allBooks

    const filters = books.map(book => book.genres).reduce((first, second) => _.union(first, second))
    const booksToShow = books.filter(book => filter === 'all'? true:book.genres.find(genre => genre.toLowerCase() === filter.toLowerCase()))
    const fav = window.localStorage.getItem('library-user-favourite-genre')

    return (
        <div>
            <h2>books</h2>
            {fav? <p>recommended is based on your favourite genre <strong>{fav}</strong></p>:null}
            {filters.map(filter =><button key={filter} onClick={() => handleFilter(filter)}>{filter}</button>)}
            {fav? <button onClick={() => handleFilter(fav)}>recommended</button>:null}
            <button onClick={() => handleFilter('all')}>all books</button>
            {booksToShow.length === 0? <p>There are no books in this genre!</p>:<table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>author</th>
                        <th>published</th>
                    </tr>
                    {booksToShow.map(a =>
                      <tr key={a.title}>
                          <td>{a.title}</td>
                          <td>{a.author.name}</td>
                          <td>{a.published}</td>
                      </tr>
                    )}
                </tbody>
            </table>}
        </div>
    )
}

export default Books