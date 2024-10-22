export const slack = {
  sendMessage: async (message: {
    text: string
  }, endpoint: string) => {
    try {
      console.log("Sending message to Slack", message)
      await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(message),
      })
    } catch (error) {
      console.error("Error sending message to Slack", error)
    }
  }
}