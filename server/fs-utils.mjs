import { dirname } from 'path'
import { fileURLToPath } from 'url'

/**
 * Solves: __dirname is not defined in ES module scope
 */
export const getLocalDirectory = referenceUrl => {
  const __filename = fileURLToPath(referenceUrl)
  return dirname(__filename)
}
