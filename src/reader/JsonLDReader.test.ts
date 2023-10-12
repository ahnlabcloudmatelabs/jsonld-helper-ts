import { describe, it, expect } from 'bun:test'

import { JsonLDReader } from './JsonLDReader'

describe('get', () => {
  describe('when given key can not find', () => {
    const givenKey = 'notFoundKey'

    it('should return null', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenKey).get()).toBeNull()
      expect(jsonld.read(0).read(givenKey).get()).toBeNull()
    })
  })

  describe('when given index, result is object', () => {
    it('should return null', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(0).read(0).get()).toBeNull()
    })
  })

  describe('when given key can find', () => {
    const givenKey = 'name'

    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenKey).get()).toBe('지상 최강의 개발자 쥬니니')
      expect(jsonld.read(0).read(givenKey).get()).toBe('지상 최강의 개발자 쥬니니')
    })
  })

  describe('when given key is preDefined key', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read('id').get()).toBe('acct:juunini@snippet.cloudmt.co.kr')
      expect(jsonld.read('@id').get()).toBe('acct:juunini@snippet.cloudmt.co.kr')
      expect(jsonld.read('type').get()).toBe('Person')
      expect(jsonld.read('@type').get()).toBe('Person')
      expect(jsonld.read(0).read('id').get()).toBe('acct:juunini@snippet.cloudmt.co.kr')
      expect(jsonld.read(0).read('@id').get()).toBe('acct:juunini@snippet.cloudmt.co.kr')
      expect(jsonld.read(0).read('type').get()).toBe('Person')
      expect(jsonld.read(0).read('@type').get()).toBe('Person')
    })
  })

  describe('when given index and key can find', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read('attachment').read(0).read('value').get()).toBe('juunini')
    })
  })
})

describe('getOrElse', () => {
  describe('when given key can not find', () => {
    const givenKey = 'notFoundKey'
    const givenDefaultValue = 'defaultValue'

    it('should return default value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenKey).getOrElse(givenDefaultValue)).toBe(givenDefaultValue)
      expect(jsonld.read(0).read(givenKey).getOrElse(givenDefaultValue)).toBe(givenDefaultValue)
    })
  })

  describe('when given key can find', () => {
    const givenKey = 'name'
    const givenDefaultValue = 'defaultValue'

    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenKey).getOrElse(givenDefaultValue)).toBe('지상 최강의 개발자 쥬니니')
      expect(jsonld.read(0).read(givenKey).getOrElse(givenDefaultValue)).toBe('지상 최강의 개발자 쥬니니')
    })
  })

  describe('when given index can not find', () => {
    const givenIndex = 1
    const givenDefaultValue = 'defaultValue'

    it('should return default value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenIndex).getOrElse(givenDefaultValue)).toBe(givenDefaultValue)
      expect(jsonld.read(0).read(0).getOrElse(givenDefaultValue)).toBe(givenDefaultValue)
    })
  })
})

describe('getOrThrow', () => {
  describe('when given key can not find', () => {
    const givenKey = 'notFoundKey'

    it('should throw error', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(() => jsonld.read(givenKey).getOrThrow()).toThrow('Not found key: notFoundKey')
      expect(() => jsonld.read(0).read(givenKey).getOrThrow()).toThrow('Not found key: notFoundKey')
    })
  })

  describe('when given key can find', () => {
    const givenKey = 'name'

    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJsonLD, options)

      expect(jsonld.read(givenKey).getOrThrow()).toBe('지상 최강의 개발자 쥬니니')
      expect(jsonld.read(0).read(givenKey).getOrThrow()).toBe('지상 최강의 개발자 쥬니니')
    })
  })
})

describe('readme JSON-LD test', () => {
  it('should return value', async () => {
    const jsonld = await JsonLDReader.parse(readmeJsonLD, options)

    expect(jsonld.read('id').get()).toBe('https://mastodon.social/users/juunini')
    expect(jsonld.read('@id').get()).toBe('https://mastodon.social/users/juunini')
    expect(jsonld.read('type').get()).toBe('Person')
    expect(jsonld.read('@type').get()).toBe('Person')
    expect(jsonld.read('url').get()).toBe('https://mastodon.social/@juunini')
    expect(jsonld.read('image').read('type').get()).toBe('Image')
    expect(jsonld.read('image').read('@type').get()).toBe('Image')
    expect(jsonld.read('image').read('mediaType').get()).toBe('image/png')
    expect(jsonld.read('image').read('url').get()).toBe('https://files.mastodon.social/accounts/headers/109/408/471/076/954/889/original/f4158a0d06a05763.png')
    expect(jsonld.read('manuallyApprovesFollowers').get()).toBe('true')
  })
})

const options = {
  documentLoader: async (url: string) => {
    if (url === 'https://www.w3.org/ns/activitystreams') {
      return {
        document: activitystream,
        documentUrl: url
      }
    }

    if (url === 'http://schema.org') {
      return {
        document: schema,
        documentUrl: url
      }
    }

    return {
      documentUrl: url,
      document: {}
    }
  }
}

const givenJsonLD = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    {
      schema: 'http://schema.org#',
      PropertyValue: 'schema:PropertyValue',
      value: 'schema:value'
    }
  ],
  'as:type': 'Person',
  '@id': 'acct:juunini@snippet.cloudmt.co.kr',
  name: '지상 최강의 개발자 쥬니니',
  attachment: [
    {
      type: 'PropertyValue',
      name: 'GitHub',
      value: 'juunini'
    }
  ]
}

const readmeJsonLD = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    {
      manuallyApprovesFollowers: 'as:manuallyApprovesFollowers'
    }
  ],
  '@id': 'https://mastodon.social/users/juunini',
  'as:type': 'Person',
  url: 'https://mastodon.social/@juunini',
  'as:image': {
    '@type': 'Image',
    'as:mediaType': 'image/png',
    url: 'https://files.mastodon.social/accounts/headers/109/408/471/076/954/889/original/f4158a0d06a05763.png'
  },
  manuallyApprovesFollowers: 'true'
}

const activitystream = {
  '@context': {
    '@vocab': '_:',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    as: 'https://www.w3.org/ns/activitystreams#',
    ldp: 'http://www.w3.org/ns/ldp#',
    vcard: 'http://www.w3.org/2006/vcard/ns#',
    id: '@id',
    type: '@type',
    attachment: {
      '@id': 'as:attachment',
      '@type': '@id'
    },
    url: {
      '@id': 'as:url',
      '@type': '@id'
    },
    mediaType: 'as:mediaType',
    name: 'as:name',
    Image: 'as:Image',
    Person: 'as:Person'
  }
}

const schema = {
  '@context': {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'https://schema.org/'
  },
  '@graph': [
    {
      '@id': 'schema:value',
      '@type': 'rdf:Property'
    },
    {
      '@id': 'schema:name',
      '@type': 'rdf:Property'
    },
    {
      '@id': 'schema:PropertyValue',
      '@type': 'rdfs:Class'
    }
  ]
}
