const { parseCommentWithUrlPropsAsKeys } = require('../../../consumers/utils/parseComments');

describe('parsing comments', () => {
  it('should convert the linting supported jsdoc with url keys into a structure jsdoc can interpret', () => {
    const comment = `
      /**
       * Learner Profile Global Extensions model
       * @typedef {{['https://api.adaptemy.io/param-a']: number, // - some description - clients:internal,bbc,
       * ['https://api.adaptemy.io/param-b']: number,
       * ['https://api.adaptemy.io/param-c']?: string // - some description}} LearnerProfileGlobalExtensions
       */
    `;
    const expected = `
      /**
       * Learner Profile Global Extensions model
       * @typedef {object} LearnerProfileGlobalExtensions
 * @property {number} httpsapi.adaptemy.io/param-a - some description - clients:internal,bbc
       * @property {number} httpsapi.adaptemy.io/param-b
       * @property {string=} httpsapi.adaptemy.io/param-c - some description
       */
    `;
    const result = parseCommentWithUrlPropsAsKeys(comment);
    expect(result).toEqual(expected);
  });
});
