/**
 * @fileoverview Page component for Snowflake query
 */
'use client'
import Form from '@/app/_components/forms/form'
import Input from '@/app/_components/forms/input'
import Button from '@/app/_components/global/button'
import PageLayout from '@/app/_components/layout/page'
import SaveQuery from '@/app/_components/snowflake/saveQuery'
import SyncToSheets from '@/app/_components/snowflake/syncToSheets'
import { modalAtom } from '@/app/_utils/atoms'
import { Query } from '@/app/_utils/types'
import { useSetAtom } from 'jotai'
import { FC, useEffect, useState } from 'react'

const Snowflake: FC = () => {

  const setModal = useSetAtom(modalAtom)
  const [loadingQueries, setLoadingQueries] = useState<boolean>(true)
  const [loadingResults, setLoadingResults] = useState<boolean>(false)
  const [queries, setQueries] = useState<any[]>()
  const [query, setQuery] = useState<Query>()
  const [queryResult, setQueryResult] = useState<any[]>([])
  const [resultsToShow, setResultsToShow] = useState<number>(100)

  const deleteQuery = async (id: string) => {
    console.log("Delete Snowflake query", id)
    const result = await fetch(`/api/database/snowflake`, {
      method: 'DELETE',
      body: JSON.stringify({ id: id })
    })
    const data = await result.json()
    console.log("Deleted Query", data)
  }

  const getQueries = async () => {
    const res = await fetch('/api/database/snowflake')
    const data = await res.json()
    console.log("Snowflake Queries", data)
    setQueries(data)
  }

  /**
   * Get all snowflake queries from the database
   */
  useEffect(() => {
    if (loadingQueries) {
      getQueries()
      setLoadingQueries(false)
    }
  }, [loadingQueries])

  return (
    <PageLayout title="Snowflake" className="h-screen overflow-hidden">
      <div className="flex flex-col gap-4 w-full h-full">
        {/* List of saved queries */}
        <ul className="w-full flex flex-row gap-4">
          {queries?.map((query, index) => (
            <div key={index} className="relative z-[0]">
              <Button
                className="text-xs pr-[32px]"
                label={query.name}
                onClick={() => {
                  console.log("Load Query", query.query)
                  setQuery(query)
                }}
              />
              <button onClick={() => {
                // Confirm before deleting the query
                if (confirm(`Are you sure you want to delete ${query.name}?`)) {
                  deleteQuery(query.id)
                  setLoadingQueries(true)
                }
              }}
                className="w-5 h-5 absolute right-2 top-[6px] text-[9px] font-bold p-[4px] flex justify-center items-center rounded-full">
                X
              </button>
            </div>
          ))}
        </ul>
        {/* Form: Execute a snowflake query */}
        <Form
          className="w-full"
          onSubmit={async (form) => {

            if (!form.query) {
              console.error("Must provide a valid query")
              return
            }
            setLoadingResults(true)
            console.log("Execute Snowflake query", form.query)
            // const result = await sf.executeQuery(form.query)
            // console.log("query result", result)
            const res = await fetch('/api/snowflake', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ query: form.query })
            })
            const data = await res.json()

            // Limit the number of results to show
            setQueryResult(data.slice(0, resultsToShow))
            setLoadingResults(false)
          }}
        >
          <textarea
            name="query"
            placeholder="Enter a snowflake query"
            className="p-4 w-full bg-gray-950 text-white border rounded-[4px]"
            onChange={(e) => setQuery({
              id: query?.id,
              name: query?.name || '',
              query: e.target.value
            })}
            value={query?.query}
          />
          <div className="actions w-full flex items-start justify-end gap-4">
            {query?.id && (
              <p className="text-sm flex-1">
                <b>Query ID: </b>
                <span>{query.id}</span>
              </p>
            )}
            {/* Modal: Sync to Sheets */}
            <SyncToSheets query={query} setQuery={setQuery} setLoadingQueries={setLoadingQueries} />
            {/* Modal: Save Query */}
            <SaveQuery query={query} setQuery={setQuery} setLoadingQueries={setLoadingQueries}/>
            {/* Execute Query */}
            <Button
              type="submit"
              className=""
              label="Execute Query"
              disabled={loadingResults || !query?.query}
              buttonType='primary'
            />
          </div>
        </Form>
        {/* Query Result */}
        <div className="relative w-full bg-gray-950 p-4 rounded-[4px] flex-1 overflow-scroll pb-4">
          {loadingResults ? (
            <div>Loading...</div>
          ) : queryResult.length > 0 ? (
            <table className="w-full text-left block absolute">
              <thead>
                <tr>
                  {Object.keys(queryResult[0]).map((key, index) => (
                    <th key={index} className="p-2">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, index) => (
                      <td key={index} className="p-2">{value as string}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>No results</div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

export default Snowflake
