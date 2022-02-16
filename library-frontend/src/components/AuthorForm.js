import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR } from '../queries'
import Select from 'react-select';

const AuthorForm = (props) => {
    const [name, setName] = useState(null)
    const [born, setBorn] = useState('')
    const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
        onError: (error) => {
            props.notify(error.graphQLErrors[0].message)
        }
    })
    const options = props.authors.map(author => { return {value: author.name, label: author.name}})

    const submit = async (event) => {
        event.preventDefault()
        editAuthor({variables: { name: name.value, born: Number(born) }})
        setName('')
        setBorn('')
    }

    return (
        <div>
            <h2>set birthyear</h2>
            <form onSubmit={submit}>
                <Select
                    value={name}
                    onChange={(selectedOption) => setName(selectedOption)}
                    options={options}
                />
                <div>
                    born
                    <input
                      value={born}
                      onChange={({ target }) => setBorn(target.value)}
                    />
                </div>
                <button type='submit'>Update Author</button>
            </form>
        </div>
    )
}

export default AuthorForm
