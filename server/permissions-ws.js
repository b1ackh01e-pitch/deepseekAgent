import { v4 as uuidv4 } from "uuid"

let permissionResolver = null

export function createPermissionHandler(ws) {
  return async function waitForPermission(prompt) {
    const id = uuidv4()
    
    // Send permission request to client
    ws.send(JSON.stringify({
      type: "permission",
      id,
      prompt
    }))

    // Wait for response
    return new Promise((resolve) => {
      permissionResolver = resolve
    })
  }
}

export function resolvePermission(answer) {
  if (permissionResolver) {
    permissionResolver(answer)
    permissionResolver = null
  }
}
