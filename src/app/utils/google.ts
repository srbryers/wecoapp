import { google } from "googleapis"

let config = {
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
} as any

const { GOOGLE_APPLICATION_CREDENTIALS } = process.env;

if (GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    // Unescape the credentials string and parse it as JSON
    config.credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS)
  } catch (err) {
    throw Error(
      `Unable to parse secret from Secret Manager. Make sure that the secret is JSON formatted: ${err}`
    );
  }
}

const auth = new google.auth.GoogleAuth(config)


const sheets = google.sheets({version: 'v4', auth});

export { sheets }