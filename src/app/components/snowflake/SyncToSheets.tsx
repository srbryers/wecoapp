import { FC, useEffect, useState } from 'react'
import Button from '../../_components/global/button'
import { Query } from '@/app/utils/types'
import { useSetAtom } from 'jotai'
import { modalAtom } from '@/app/utils/atoms'
import Form from '../../_components/forms/form'
import Input from '../../_components/forms/input'

type SyncToSheetsProps = {
  query: Query | undefined
  setQuery: React.Dispatch<React.SetStateAction<Query | undefined>>
  setLoadingQueries: React.Dispatch<React.SetStateAction<boolean>>
}

const SyncToSheets: FC<SyncToSheetsProps> = ({ query, setQuery, setLoadingQueries }) => {

  const setModal = useSetAtom(modalAtom)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [runningSync, setRunningSync] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)

  /**
   * Modal to choose the Google Sheets to sync the query to and sync it
   */
  useEffect(() => {
    const saveConfig = async () => {
      setSavingConfig(true)
      // Save/update the query to the database
      const result = await fetch('/api/database/snowflake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: query?.query, 
          name: query?.name,
          sheet_id: query?.sheet_id,
          sheet_tab_name: query?.sheet_tab_name 
        })
      })
      const data = await result.json()
      console.log("Saved Query", data)
      setSavingConfig(false)
      setLoadingQueries(true)
    }
    // Modal to save the query
    if (showModal) {
      setModal({
        visible: true,
        title: "Sync to Sheets",
        description: "Choose which sheet ID and tab to sync the snowflake query results to.",
        children: (
          <Form
            className="w-full mt-4"
            onSubmit={async (form) => {
              setRunningSync(true)
              // Save the config to the database
              await saveConfig()
              // Sync the query to Google Sheets
              console.log("Sync to Sheets", form)
              const res = await fetch('/api/database/snowflake/sheets', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  sheetId: form.sheet_id,
                  sheetTab: form.sheet_tab_name,
                  queryId: query?.id
                })
              })
              const data = await res.json()
              console.log("Sync to Sheets", data)
              
              setRunningSync(false)
              setLoadingQueries(true)
            }}
          >
            <Input
              name="sheet_id"
              label="Sheet ID"
              type="text"
              placeholder="The Sheet ID to sync data to"
              value={query?.sheet_id}
              onChange={(e) => {
                setQuery({
                  id: query?.id,
                  name: query?.name || '',
                  query: query?.query || '',
                  sheet_id: e.target.value,
                  sheet_tab_name: query?.sheet_tab_name
                })
              }}
            />
            <Input
              name="sheet_tab_name"
              label="Tab Name"
              type="text"
              placeholder="The name of the sheet tab"
              value={query?.sheet_tab_name}
              onChange={(e) => {
                setQuery({
                  id: query?.id,
                  name: query?.name || '',
                  query: query?.query || '',
                  sheet_id: query?.sheet_id,
                  sheet_tab_name: e.target.value
                })
              }}
            />
            <p className="tex-sm"><b>Query ID: </b>{query?.id}</p>
            <p className="p-4 border rounded-[4px] bg-gray-950">{query?.query || ''}</p>
            <div className="actions w-full flex justify-end gap-4">
              <Button
                type="submit"
                buttonType="primary"
                className=""
                label={runningSync ? "Syncing..." : "Sync to Sheets"}
              />
              <Button
                type="button"
                buttonType="primary"
                className=""
                label={savingConfig ? "Saving..." : "Save Config"}
                onClick={saveConfig}
              />
              <Button
                type="button"
                buttonType="secondary"
                className="h-full"
                label="Cancel"
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
  }, [query, runningSync, savingConfig, setLoadingQueries, setModal, setQuery, showModal])

  return (
    <Button
      type="button"
      className="h-full"
      label="Sync to Google Sheets"
      buttonType="secondary"
      disabled={!query?.id}
      onClick={() => {
        // Sync the query to Google Sheets
        setShowModal(true)
      }}
    />
  )
}

export default SyncToSheets