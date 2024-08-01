import { FormEvent } from "react"
import { FormValues, MenuZone } from "./types";

export const formatKeyToTitle = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());
}

export const parseFormData = (event: FormEvent<HTMLFormElement>) => {
  const data = new FormData(event.currentTarget)
  const entries = data.entries() as unknown as any[]
  let values: any[] = []
  entries.forEach(([key, value]) => {
    values.push({ [key]: value })
  })
  values = values.reduce((acc, val) => {
    return {
      ...acc,
      ...val
    }
  })
  return values as FormValues
}

export const formatDate = (yourDate: Date) => {
  const offset = yourDate.getTimezoneOffset()
  yourDate = new Date(yourDate.getTime() - (offset*60*1000))
  return yourDate.toISOString().split('T')[0]
}

export const calculateAvailableDeliveryDates = (activeMenuZone: MenuZone, date?: Date) => {
  // Available days
  const availableDeliveryDays = activeMenuZone.week_day_availability
  const availableDeliveryDates: string[] = []

  // Calculate the delivery dates
  const now = date || new Date()
  const lookaheadDays = 14
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (activeMenuZone.cutoff_time 
    && activeMenuZone.cutoff_hours
    && availableDeliveryDays) {
    // Calculate the cutoff time
    const cutoffTime = activeMenuZone.cutoff_time
    const cutoffHoursMs = activeMenuZone.cutoff_hours * 60 * 60 * 1000
    // Convert the HH:MMpm cutoffTime to a date object
    const cutoffTimeArray = cutoffTime.split(":") // [HH, MMpm]
    const cutoffHour = (cutoffTimeArray[1]?.indexOf('pm') > -1 ? 12 : 0) + Number(cutoffTimeArray[0])
    const cutoffMinute = Number(cutoffTimeArray[1].replace("pm", ""))
    const cutoffDate = new Date(now)
    cutoffDate.setHours(cutoffHour)
    cutoffDate.setMinutes(cutoffMinute)
    cutoffDate.setSeconds(0)

    // If we're past the cutoff, then add a day
    if (now.getTime() > cutoffDate.getTime()) {
      now.setDate(now.getDate() + 1)
      now.setHours(cutoffHour)
      now.setMinutes(cutoffMinute)
      now.setSeconds(0)
    }

    for (var i = 1; i <= lookaheadDays; i++) {

      // Get the next day
      const nextDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      nextDate.setHours(cutoffHour)
      nextDate.setMinutes(cutoffMinute)
      nextDate.setSeconds(0)
      const nextDayDateString = formatDate(nextDate)
      const nextDay = nextDate.getDay()

      // Check if the next day is in the available delivery days
      availableDeliveryDays.forEach((availableDeliveryDay: string) => {
        const deliveryDayIndex = daysOfWeek.findIndex(d => d === availableDeliveryDay)
        if (deliveryDayIndex === nextDay) {
          const dateDiff = nextDate.valueOf() - now.valueOf()
          // Convert date Diff to hours
          if (dateDiff >= cutoffHoursMs) {
            availableDeliveryDates.push(nextDayDateString)
          }
        }
      })
    }
  }

  return availableDeliveryDates
}