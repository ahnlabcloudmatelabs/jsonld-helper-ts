import {
  expand,
  type Options,
  type JsonLdDocument
} from 'jsonld'

export class JsonLDReader {
  /**
   * parsed JSON-LD value
   */
  public readonly value: unknown
  /**
   * length of parsed JSON-LD value
   */
  public readonly length: number
  private readonly namespace: Record<string, string>

  /**
   * [CAUTION] instead of using constructor, use `JsonLDReader.parse`
   *
   * @param value parsed JSON-LD value or final value
   * @param namespace mapping contexts. e.g. `{ as: 'https://www.w3.org/ns/activitystreams' }`, when you want to use `.read('as', 'url')` as `https://www.w3.org/ns/activitystreams#url`
   */
  constructor (value?: unknown, namespace?: Record<string, string>) {
    this.value = value
    this.namespace = namespace ?? {}
    this.length = Array.isArray(value) ? value.length : 1
  }

  /**
   * @param value parsed JSON-LD value or final value
   * @param namespace mapping contexts. e.g. `{ as: 'https://www.w3.org/ns/activitystreams' }`, when you want to use `.read('as', 'url')` as `https://www.w3.org/ns/activitystreams#url`
   */
  static of (value: unknown, namespace?: Record<string, string>): JsonLDReader {
    return new JsonLDReader(value, namespace)
  }

  /**
   * parse JSON-LD value. this method uses jsonld library's expand method.
   *
   * @param value JSON-LD object or array of JSON-LD objects
   * @param options jsonld library's Options.Expand. see https://github.com/digitalbazaar/jsonld.js#custom-document-loader
   */
  static async parse (value: object | object[], options?: Options.Expand): Promise<JsonLDReader> {
    const data = await expand(value as JsonLdDocument, options)
    return JsonLDReader.of(data)
  }

  /**
   * this method not change current namespace value(no side effect). returns new JsonLDReader instance.
   *
   * @param namespace mapping contexts. e.g. `{ as: 'https://www.w3.org/ns/activitystreams' }`, when you want to use `.read('as', 'url')` as `https://www.w3.org/ns/activitystreams#url`
   */
  public setNamespace (namespace: Record<string, string>): JsonLDReader {
    return JsonLDReader.of(this.value, namespace)
  }

  /**
   * @param key key or index of array. if given key is `outbox` and has `https://www.w3.org/ns/activitystreams#outbox`, returns value of `https://www.w3.org/ns/activitystreams#outbox`.
   * @returns JsonLDReader instance. if key is not found, returns `Nothing` instance.
   */
  public read (key: string | number): JsonLDReader
  /**
   * @param namespace if use `setNamespace` method to set namespace, you can use namespace as first argument. if not, insert full url as first argument. e.g. `https://www.w3.org/ns/activitystreams`
   * @param key insert key. e.g. `url`. if has value is array and length is 1, it reads first element of array automatically.
   * @returns JsonLDReader instance. if key is not found, returns `Nothing` instance.
   */
  public read (namespace: string, key: string): JsonLDReader
  public read (namespaceOrKey: string | number, key?: string): JsonLDReader {
    const _key = this.key(namespaceOrKey, key)

    return typeof _key === 'number'
      ? this.readArray(_key)
      : this.readObject(_key)
  }

  private key (namespace: string | number, key?: string): string | number {
    if (key === undefined) {
      const [key, isPreDefined] = this.preDefinedKey(namespace)
      if (isPreDefined) {
        return key
      }

      return key
    }

    const [_key, isPreDefined] = this.preDefinedKey(key)
    if (isPreDefined) {
      return _key
    }

    return `${this.namespace[namespace] ?? namespace}#${_key}`
  }

  private preDefinedKey (key: string | number): [string | number, boolean] {
    if (['id', '@id'].includes(key.toString())) {
      return ['@id', true]
    }

    if (['type', '@type'].includes(key.toString())) {
      return ['@type', true]
    }

    return [key, false]
  }

  /**
   * you can use `getOrThrow` or `getOrElse` instead of this method. if it has error, returns `null`.
   *
   * @returns parsed JSON-LD value(object or array) or final value
   */
  public get (): unknown {
    return this.getValue()
  }

  /**
   * @param error (optional) error when value is not found. default is `new Error('Not an array')` or `new Error('Not an object')` or `new Error('Not found key: ' + key)`
   * @returns parsed JSON-LD value(object or array) or final value
   */
  // eslint-disable-next-line n/handle-callback-err
  public getOrThrow (error?: Error): unknown {
    return this.getValue()
  }

  /**
   * @param defaultValue default value when value is not found
   * @returns parsed JSON-LD value(object or array) or final value
   */
  public getOrElse (defaultValue: unknown): unknown {
    return this.getValue()
  }

  /**
   * @param error (optional) error when value is not found. default is `new Error('Not a string')`
   */
  public stringOrThrow (error?: Error): string {
    const value = this.getValue()

    if (['string', 'number', 'bigint', 'boolean'].includes(typeof value)) {
      return String(value)
    }

    throw error ?? new Error('Not a string')
  }

  /**
   * @param defaultValue default value when value is not found
   */
  public stringOrElse (defaultValue: string): string {
    try {
      return this.stringOrThrow()
    } catch {
      return defaultValue
    }
  }

  /**
   * @param error (optional) error when value is not found. default is `new Error('Not a number')`
   */
  public numberOrThrow (error?: Error): number {
    const value = this.getValue()
    if (typeof value === 'number') {
      return value
    }

    const numberValue = Number(value)
    if (isNaN(numberValue)) {
      throw error ?? new Error('Not a number')
    }

    return numberValue
  }

  /**
   * @param defaultValue default value when value is not found
   */
  public numberOrElse (defaultValue: number): number {
    try {
      return this.numberOrThrow()
    } catch {
      return defaultValue
    }
  }

  /**
   * @param error (optional) error when value is not found. default is `new Error('Not a boolean')`
   * @returns parsed boolean value. if value in `[true, false, 0, 1, '0', '1', 'true', 'false']`, returns boolean.
   */
  public booleanOrThrow (error?: Error): boolean {
    const value = this.getValue()

    if (typeof value === 'boolean') {
      return value
    }

    if (value === 'true' || value === 'false' || value === '0' || value === '1') {
      return value === 'true' || value === '1'
    }

    if (value === 0 || value === 1) {
      return value === 1
    }

    throw error ?? new Error('Not a boolean')
  }

  /**
   * @param defaultValue default value when value is not found
   * @returns parsed boolean value. if value in `[true, false, 0, 1, '0', '1', 'true', 'false']`, returns boolean.
   */
  public booleanOrElse (defaultValue: boolean): boolean {
    try {
      return this.booleanOrThrow()
    } catch {
      return defaultValue
    }
  }

  private readArray (key: number): JsonLDReader {
    if (!Array.isArray(this.value)) {
      return new Nothing(new Error('Not an array'))
    }
    return JsonLDReader.of(this.value[key], this.namespace)
  }

  private readObject (key: string): JsonLDReader {
    if (!this.valueIsObject()) {
      return new Nothing(new Error('Not an object'))
    }

    const scope = this.scope() as Record<string, any>
    const value = scope[key]

    if (value !== undefined) {
      if (key === '@type') {
        return JsonLDReader.of(this.extractType(value), this.namespace)
      }
      return JsonLDReader.of(value, this.namespace)
    }

    const extractedKey = Object.keys(scope).find((k) => k.split('#')[1] === key)

    return extractedKey === undefined
      ? new Nothing(new Error(`Not found key: ${key}`))
      : JsonLDReader.of(scope[extractedKey], this.namespace)
  }

  private extractType (value: string): string {
    if (Array.isArray(value)) {
      return this.extractType(value[0])
    }

    const hashSplit = value.split('#')
    if (hashSplit.length === 2) {
      return hashSplit[1]
    }

    const slashSplit = value.split('/')
    return slashSplit[slashSplit.length - 1]
  }

  private valueIsObject (): boolean {
    if (Array.isArray(this.value) && this.length === 1) {
      return true
    }

    if (Array.isArray(this.value)) {
      return false
    }

    return typeof this.value === 'object'
  }

  private scope (): unknown {
    if (Array.isArray(this.value) && this.length === 1) {
      return this.value[0]
    }

    return this.value
  }

  private getValue (): unknown {
    if (['string', 'number', 'bigint', 'boolean'].includes(typeof this.value)) {
      return this.value
    }

    if ((this.value as any[])?.length === 1) {
      const scope = (this.value as any[])[0]
      return scope?.['@value'] ?? scope?.['@id'] ?? scope
    }

    return (this.value as any)['@value'] ?? (this.value as any)['@id'] ?? this.value
  }
}

class Nothing extends JsonLDReader {
  public readonly error: Error

  constructor (error: Error) {
    super()
    this.error = error
  }

  public read (): JsonLDReader {
    return this
  }

  public get (): null {
    return null
  }

  public getOrThrow (error?: Error): unknown {
    throw error ?? this.error
  }

  public getOrElse (defaultValue: unknown): unknown {
    return defaultValue
  }

  public stringOrThrow (error?: Error): string {
    throw error ?? this.error
  }

  public stringOrElse (defaultValue: string): string {
    return defaultValue
  }

  public numberOrThrow (error?: Error): number {
    throw error ?? this.error
  }

  public numberOrElse (defaultValue: number): number {
    return defaultValue
  }

  public booleanOrThrow (error?: Error): boolean {
    throw error ?? this.error
  }

  public booleanOrElse (defaultValue: boolean): boolean {
    return defaultValue
  }
}
