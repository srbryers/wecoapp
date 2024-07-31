'use client'
import { klaviyo, ProfileFilters } from '@/app/utils/klaviyo/api'
import Button from '@/app/components/Button'
import Divider from '@/app/components/Divider'
import Input from '@/app/components/forms/Input'
import DataTable from '@/app/components/tables/DataTable'
import DataTableCell from '@/app/components/tables/DataTableCell'
import DataTableHeaders from '@/app/components/tables/DataTableHeaders'
import DataTableRow from '@/app/components/tables/DataTableRow'
import { FC, useState } from 'react'

type ProfileKeys = string[]

const profileDataKeys = [
  "email",
  "created",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "$source"
] as ProfileKeys

const Klaviyo: FC = () => {

  const [startDate, setStartDate] = useState<string>()
  const [endDate, setEndDate] = useState<string>()
  const [profileData, setProfileData] = useState<any>()

  const getProfiles = async () => {
    const profileFields = ["email", "properties", "created"]
    let formattedStartDate
    if (startDate) {
      const date = new Date(startDate)
      const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      formattedStartDate = adjustedDate.toISOString().split("T")[0]
    }

    const profileFilters = [
      (formattedStartDate && { key: "created", value: formattedStartDate, operator: "greater-than" }),
      (endDate && { key: "created", value: endDate, operator: "less-than" }),
    ].filter(x => x !== undefined) as ProfileFilters
    const profiles = await klaviyo.profiles.get(profileFields, profileFilters)


    const profilesArray = Object.values(profiles?.data)
    console.log("profilesArray", profilesArray)
    const formattedData = profilesArray?.map((profile: any) => {
      const result = {
        email: profile.attributes.email,
        created: profile.attributes.created.split("T")[0],
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        $source: profile.attributes.$source
      } as { [key: string]: string }

      for (const [key, value] of Object.entries(profile.attributes.properties)) {
        const attributeKey = key.toLowerCase()
        if (attributeKey.indexOf('utm') > -1) {
          if (attributeKey.indexOf('source') > -1 && value) {
            result.utm_source = typeof value === "string" ? value : ""
          }
          if (attributeKey.indexOf('medium') > -1 && value) {
            result.utm_medium = typeof value === "string" ? value : ""
          }
          if (attributeKey.indexOf('campaign') > -1 && value) {
            result.utm_campaign = typeof value === "string" ? value : ""
          }
          console.log("result", result)
        }
      }

      return result
    })
    console.log("formattedData", formattedData)
    setProfileData(formattedData)
  }

  return (
    <div>
      <div className="flex flex-row gap-4 w-full justify-between items-center pb-6">
        <div className="flex flex-row gap-2">
          <Input name="startDate" type="date" onChange={(e) => setStartDate(e.target.value)} label="Start Date" />
          <Input name="endDate" type="date" onChange={(e) => setEndDate(e.target.value)} label="End Date" />
        </div>
        <Button onClick={getProfiles} label="Get Profiles" />
      </div>
      <Divider />
      {/* Grid Content */}
      <div className="table-wrapper w-full">
        <DataTable>
          <thead>
            <tr>
              {profileDataKeys.map((key, index) => {
                return (
                  <DataTableHeaders key={`header-${index}`} className="p-2 border border-gray-700" colSpan={index === 0 ? 2 : 1}>
                    {key}
                  </DataTableHeaders>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {profileData && profileData.map((profile: any, index: number) => {
              return (
                <DataTableRow key={`row-${index}`}>
                  {Object.values(profile).map((value, valueIndex) => {
                    return (
                      <DataTableCell key={`value-${index}${valueIndex}`} colSpan={valueIndex === 0 ? 2 : 1}>
                        {value as string}
                      </DataTableCell>
                    )
                  })}
                </DataTableRow>
              )
            })}
          </tbody>
        </DataTable>
      </div>
    </div>
  )
}

export default Klaviyo