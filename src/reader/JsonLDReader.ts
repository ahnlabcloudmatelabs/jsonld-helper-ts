import {
  expand,
  type Options,
  type JsonLdDocument
} from 'jsonld'

import { read } from './utils/read'

export class JsonLDReader {
  /**
   * parsed JSON-LD value
   */
  public readonly value: unknown
  /**
   * length of parsed JSON-LD value
   */
  public readonly length: number

  /**
   * [CAUTION] instead of using constructor, use `JsonLDReader.parse`
   *
   * @param value parsed JSON-LD value or final value
   */
  constructor (value?: unknown) {
    this.value = value
    this.length = Array.isArray(value) ? value.length : 1
  }

  /**
   * @param value parsed JSON-LD value or final value
   * @param namespace mapping contexts. e.g. `{ as: 'https://www.w3.org/ns/activitystreams' }`, when you want to use `.read('as', 'url')` as `https://www.w3.org/ns/activitystreams#url`
   */
  static of (value: unknown): JsonLDReader {
    return new JsonLDReader(value)
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

  public strict (): JsonLDReader {
    return JsonLDReader.of(this.value)
  }

  /**
   * @param keyOrIndex
   * @returns JsonLDReader instance. if key is not found, returns `Nothing` instance.
   */
  public read (keyOrIndex: string | number): JsonLDReader {
    return read({
      jsonld: this.value,
      index: typeof keyOrIndex === 'number' ? keyOrIndex : undefined,
      key: typeof keyOrIndex === 'string' ? keyOrIndex : undefined
    })
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

export class Nothing extends JsonLDReader {
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
