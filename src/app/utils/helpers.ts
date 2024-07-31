import { FormEvent } from "react"
import { FormValues } from "./types";

export const formatKeyToTitle = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());
}

export const parseFormData = (event: FormEvent<HTMLFormElement>) => {
  const data = new FormData(event.currentTarget)
  let values: any[] = []
  data.entries().forEach(([key, value]) => {
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