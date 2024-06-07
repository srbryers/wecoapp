import { modalAtom } from '@/app/_utils/atoms'
import { useSetAtom } from 'jotai'
import { FC, useEffect, useState } from 'react'
import Form from '../forms/form'
import { Query } from '@/app/_utils/types'
import Input from '../forms/input'
import Button from '../global/button'

type SaveQueryProps = {
  query: Query | undefined
  setQuery: React.Dispatch<React.SetStateAction<Query | undefined>>
  setLoadingQueries: React.Dispatch<React.SetStateAction<boolean>>
}

const SaveQuery: FC<SaveQueryProps> = ({ query, setQuery, setLoadingQueries }) => {

  const setModal = useSetAtom(modalAtom)
  const [showModal, setShowModal] = useState<boolean>(false)

  /**
   * Modal to save the query
   */
  useEffect(() => {
    // Modal to save the query
    if (showModal) {
      setModal({
        visible: true,
        title: "Save Query",
        description: "Save the Snowflake query to the database.",
        children: (
          <Form
            className="w-full mt-4"
            onSubmit={async (form) => {
              // Save the query to the database
              const result = await fetch('/api/database/snowflake', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  query: query?.query, 
                  name: form.query_name 
                })
              })
              const data = await result.json()
              console.log("Saved Query", data)
              setQuery(data)
              setLoadingQueries(true)
              setShowModal(false)
              setModal(null)
            }}
          >
            <Input
              name="query_name"
              label="Query Name"
              type="text"
              placeholder="Enter a name for the query"
            />
            <p className="p-4 border rounded-[4px] bg-gray-950">{query?.query || ''}</p>
            <div className="actions w-full flex justify-end gap-4">
              <Button
                type="submit"
                buttonType="primary"
                className=""
                label="Save Query"
              />
              <Button
                type="button"
                className="h-full"
                label="Cancel"
                buttonType="secondary"
                onClick={() => {
                  setShowModal(false); setModal(null)
                }}
              />
            </div>
          </Form>
        ),
        onClose: () => {
          setShowModal(false)
        }
      })
    }
  }, [query, setQuery, setLoadingQueries, setModal, showModal])

  return (
    <Button
      type="button"
      className="h-full"
      buttonType="secondary"
      label="Save Query"
      disabled={!query?.query}
      onClick={() => {
        // Save the query to the database
        setShowModal(true)
      }}
    />
  )
}

export default SaveQuery