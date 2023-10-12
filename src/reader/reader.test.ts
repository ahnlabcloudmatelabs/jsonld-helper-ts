import { describe, it, expect } from 'bun:test'

import { JsonLDReader } from './JsonLDReader'

describe('read', () => {
  describe('when given key is not found', () => {
    it('should changes type Nothing', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read('uid').getOrThrow()).toThrow('Not found key: uid')
    })
  })

  describe('when given key is string, but value is not object', () => {
    it('should changes type Nothing', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read('id').read('@context').getOrThrow()).toThrow('Not an object')
    })
  })

  describe('when given key is number, but value is not array', () => {
    it('should changes type Nothing', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read(0).read(0).getOrThrow()).toThrow('Not an array')
    })
  })

  describe('when error case and given throw error', () => {
    it('should throws given error', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read('uid').getOrThrow(new Error('test'))).toThrow('test')
    })
  })

  describe('when given key is string, find key', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(
        jsonld
          .read('outbox')
          .getOrThrow()
      ).toBe('https://mastodon.social/users/juunini/outbox')
    })
  })

  describe('when not given namespace, find key', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(jsonld.read('outbox').get()).toBe('https://mastodon.social/users/juunini/outbox')
    })
  })

  describe('when given key is preDefined key', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(jsonld.read('@id').get()).toBe('https://mastodon.social/users/juunini')
      expect(jsonld.read('id').get()).toBe('https://mastodon.social/users/juunini')
      expect(jsonld.read('@type').get()).toBe('Person')
      expect(jsonld.read('type').get()).toBe('Person')
    })
  })
})

describe('stringOrThrow', () => {
  describe('when given value is string', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(
        jsonld
          .read('image')
          .read('url')
          .stringOrThrow()
      ).toBe('https://files.mastodon.social/accounts/headers/109/408/471/076/954/889/original/f4158a0d06a05763.png')
    })
  })

  describe('when given value is not string', () => {
    it('should throws error', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(
        jsonld
          .read('manuallyApprovesFollowers')
          .stringOrThrow()
      ).toBe('false')
    })
  })
})

describe('numberOrThrow', () => {
  describe('when given value is number', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(
        jsonld
          .read('accuracy')
          .numberOrThrow()
      ).toBe(1)
    })
  })

  describe('when given value is not number', () => {
    it('should throws error', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read('@id').numberOrThrow()).toThrow('Not a number')
    })
  })
})

describe('booleanOrThrow', () => {
  describe('when given value is boolean', () => {
    it('should return value', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(
        jsonld
          .read('closed')
          .booleanOrThrow()
      ).toBe(true)
    })
  })

  describe('when given value is not boolean', () => {
    it('should throws error', async () => {
      const jsonld = await JsonLDReader.parse(givenJSONLD)
      expect(() => jsonld.read('@id').booleanOrThrow()).toThrow('Not a boolean')
    })
  })
})

describe('booleanOrElse', () => {
  const givenJsonLD = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      {
        manuallyApprovesFollowers: 'as:manuallyApprovesFollowers'
      }
    ],
    'as:id': 'https://mastodon.social/users/juunini',
    'as:type': 'Person',
    'as:url': 'https://mastodon.social/@juunini',
    'as:image': {
      'as:type': 'Image',
      'as:mediaType': 'image/png',
      url: 'https://files.mastodon.social/accounts/headers/109/408/471/076/954/889/original/f4158a0d06a05763.png'
    },
    'as:manuallyApprovesFollowers': 'true'
  }

  it('should return value', async () => {
    const jsonld = await JsonLDReader.parse(givenJsonLD)

    const manuallyApprovesFollowers = jsonld
      .read('manuallyApprovesFollowers')
      .booleanOrElse(false)

    expect(manuallyApprovesFollowers).toBe(true)
  })
})

const givenJSONLD = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    {
      manuallyApprovesFollowers: 'as:manuallyApprovesFollowers'
    }
  ],
  accuracy: 1,
  '@id': 'https://mastodon.social/users/juunini',
  'as:type': 'Person',
  following: 'https://mastodon.social/users/juunini/following',
  followers: 'https://mastodon.social/users/juunini/followers',
  inbox: 'https://mastodon.social/users/juunini/inbox',
  outbox: 'https://mastodon.social/users/juunini/outbox',
  preferredUsername: 'juunini',
  name: '지상 최강의 개발자 쥬니니',
  summary: '',
  url: 'https://mastodon.social/@juunini',
  manuallyApprovesFollowers: false,
  closed: 'true',
  published: '2022-11-26T00:00:00Z',
  endpoints: {
    sharedInbox: 'https://mastodon.social/inbox'
  },
  icon: {
    type: 'Image',
    mediaType: 'image/jpeg',
    url: 'https://files.mastodon.social/accounts/avatars/109/408/471/076/954/889/original/aa381e203bb80bb7.jpg'
  },
  image: {
    type: 'Image',
    mediaType: 'image/png',
    url: 'https://files.mastodon.social/accounts/headers/109/408/471/076/954/889/original/f4158a0d06a05763.png'
  }
}
