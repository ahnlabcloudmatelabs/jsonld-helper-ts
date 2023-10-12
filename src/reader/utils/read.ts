import { JsonLDReader, Nothing } from '../JsonLDReader'

type Scope = Record<string, unknown>
interface ReadAsObject {
  scope: Scope
  key: string
}
interface ReadAsArray {
  scope: Scope[]
  index: number
}
interface Read {
  jsonld: unknown
  index?: number
  key?: string
}

export function read ({
  jsonld,
  index,
  key
}: Read): JsonLDReader {
  if (Array.isArray(jsonld)) {
    if (index !== undefined) {
      return readAsArray({ scope: jsonld, index })
    }

    if (jsonld.length > 2) {
      return new Nothing(new Error('Not an object'))
    }

    return read({
      jsonld: jsonld[0],
      key
    })
  }

  if (index !== undefined) {
    return new Nothing(new Error('Not an array'))
  }

  if (typeof jsonld !== 'object') {
    return new Nothing(new Error('Not an object'))
  }

  if (key === undefined) {
    return new Nothing(new Error('key or index is required'))
  }

  return readAsObject({
    scope: jsonld as Scope,
    key
  })
}

function readAsArray ({ scope, index }: ReadAsArray): JsonLDReader {
  const value = scope[index]

  if (value !== undefined) {
    return JsonLDReader.of(value)
  }

  return new Nothing(new Error(`Not found index: ${index}`))
}

function readAsObject ({ scope, key }: ReadAsObject): JsonLDReader {
  const [value, isPreDefined] = readAsPreDefinedKey(scope, key)

  if (isPreDefined) {
    return JsonLDReader.of(value)
  }

  const fullKey = getFullKey(scope, key)

  if (fullKey === undefined) {
    return new Nothing(new Error(`Not found key: ${key}`))
  }

  return key === 'type'
    ? JsonLDReader.of(extractType(scope[fullKey] as string | string[]))
    : JsonLDReader.of(scope[fullKey])
}

function getFullKey (scope: Scope, key: string): string | undefined {
  const fullKey = Object.keys(scope).find((k) => k.split('#')[1] === key)

  if (fullKey !== undefined) {
    return fullKey
  }

  return Object.keys(scope).find((k) => {
    const split = k.split('/')
    return split[split.length - 1] === key
  })
}

function readAsPreDefinedKey (scope: Scope, key: string): [unknown, boolean] {
  if (['type', '@type'].includes(key)) {
    const [type, founded] = readType(scope)

    if (founded) {
      return [type, true]
    }
  }

  if (['id', '@id'].includes(key)) {
    const [id, founded] = readId(scope)

    if (founded) {
      return [id, true]
    }
  }

  if (['value', '@value'].includes(key)) {
    const [value, founded] = readValue(scope)

    if (founded) {
      return [value, true]
    }
  }

  return ['', false]
}

function readType (scope: Scope): [unknown, boolean] {
  const value = scope['@type']

  if (value !== undefined) {
    return [extractType(value as string | string[]), true]
  }

  const key = Object.keys(scope).find((k) => k.split('#')[1] === 'type')

  if (key !== undefined) {
    return [extractType(scope[key] as string | string[]), true]
  }

  return ['', false]
}

function readId (scope: Scope): [unknown, boolean] {
  const value = scope['@id']

  if (value !== undefined) {
    return [value, true]
  }

  const key = Object.keys(scope).find((k) => k.split('#')[1] === 'id')

  if (key !== undefined) {
    return [scope[key], true]
  }

  return ['', false]
}

function readValue (scope: Scope): [unknown, boolean] {
  const value = scope['@value']

  if (value !== undefined) {
    return [value, true]
  }

  const key = Object.keys(scope).find((k) => k.split('#')[1] === 'value')

  if (key !== undefined) {
    return [scope[key], true]
  }

  return ['', false]
}

function extractType (value: string | string[]): string {
  if (Array.isArray(value)) {
    return extractType(value[0])
  }

  if (typeof value === 'object') {
    return value['@value']
  }

  const hashSplit = value.split('#')

  if (hashSplit.length === 2) {
    return hashSplit[1]
  }

  const slashSplit = value.split('/')

  if (slashSplit.length === 1) {
    return value
  }

  return slashSplit[slashSplit.length - 1]
}
