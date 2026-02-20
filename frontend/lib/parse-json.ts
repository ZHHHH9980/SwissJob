export function parseJsonFromText(text: string) {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    const objectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }

    const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }

    throw new Error('Model did not return valid JSON')
  }
}

