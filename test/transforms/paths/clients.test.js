const jsdocInfo = require('../../../consumers/jsdocInfo');
const setPaths = require('../../../transforms/paths');

describe('Paths - clients', () => {
  it('Should return docs if client is specified and current client matches any of the listed clients', () => {
    const jsodInput = [`
      /**
       * GET /api/v1
       * @clients bbc | internal
       * @tags album
       */
    `];
    const expected = {
      paths: {
        '/api/v1': {
          get: {
            deprecated: false,
            description: undefined,
            summary: '',
            tags: [
              'album',
            ],
            responses: {},
            parameters: [],
            security: [],
          },
        },
      },
    };
    const parsedJSDocs = jsdocInfo({ client: 'bbc', unwrap: true })(jsodInput);
    const result = setPaths({}, parsedJSDocs);
    expect(result).toEqual(expected);
  });

  it('Should not return docs if client is specified and current client is not a match', () => {
    const jsodInput = [`
      /**
       * GET /api/v1
       * @clients folens
       * @tags album
       */
    `];
    const expected = {
      paths: {},
    };
    const parsedJSDocs = jsdocInfo({ client: 'bbc', unwrap: true })(jsodInput);
    const result = setPaths({}, parsedJSDocs);
    expect(result).toEqual(expected);
  });
});
