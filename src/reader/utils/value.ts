export function getValue (value: unknown): unknown {
  if (['string', 'number', 'bigint', 'boolean'].includes(typeof value)) {
    return value
  }

  if (Array.isArray(value)) {
    if (value.length === 1) {
      const scope = value[0]
      return scope?.['@value'] ?? scope?.['@id'] ?? scope
    }

    return value
  }

  if (typeof value === 'object') {
    const scope: any = value
    return scope['@value'] ?? scope['@id'] ?? value
  }

  return value
}
