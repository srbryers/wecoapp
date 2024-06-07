import snowflake from 'snowflake-sdk'
import crypto from 'crypto'
import fs from 'fs'

const getPrivateKey = () => {
  const key = process.env['SNOWFLAKE_PRIVATE_KEY'] as string

  const privateKeyObject = crypto.createPrivateKey({
    key: key,
    format: 'pem',
    passphrase: 'frontier45'
  });

  var privateKey = privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8'
  });

  return privateKey
}

const executeQuery = async (sql: string) => {

  const privateKey = getPrivateKey()

  const connection = snowflake.createConnection({
    account: process.env['SNOWFLAKE_ACCOUNT'] || '',
    username: process.env['SNOWFLAKE_USERNAME'],
    authenticator: "SNOWFLAKE_JWT",
    privateKey: privateKey as string,
    privateKeyPass: process.env['SNOWFLAKE_PRIVATE_KEY_PASS'] as string,
    warehouse: 'COMPUTE_WH',
    role: 'ACCOUNTADMIN'
  });

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error("Unable to connect: " + err.message)
        reject(err)
      } else {
        conn.execute({
          sqlText: sql,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(err)
            } else {
              resolve(rows)
            }
          }
        })
      }
    })
  })

}

export const sf = {
  executeQuery
}