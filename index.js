const swaggerUi = require('swagger-ui-express');
const merge = require('merge');

const defaultOptions = require('./config/default');
const swaggerEventsOptions = require('./config/swaggerEvents');
const processSwagger = require('./processSwagger');
const swaggerEvents = require('./swaggerEvents');

const expressJSDocSwagger = app => (userOptions = {}, userSwagger = {}) => {
  const events = swaggerEvents(swaggerEventsOptions(userOptions));
  const { instance } = events;
  let swaggerObject = {};

  const options = {
    ...defaultOptions,
    ...userOptions,
  };

  processSwagger(options, events.processFile)
    .then(result => {
      swaggerObject = {
        ...swaggerObject,
        ...result.swaggerObject,
      };
      swaggerObject = merge.recursive(true, swaggerObject, userSwagger);
      events.finish(swaggerObject, {
        jsdocInfo: result.jsdocInfo,
        getPaths: result.getPaths,
        getComponents: result.getComponents,
        getTags: result.getTags,
      });
    })
    .catch(events.error);

  if (options.exposeSwaggerUI) {
    app.use(options.swaggerUIPath, (req, res, next) => {
      swaggerObject = {
        ...swaggerObject,
        host: req.get('host'),
      };
      // The below is a change to the order of the swagger output to put 'paths' before 'components'.
      // This is to fix a bug where 'allOf' properties were not displaying correctly in the 'example value'.
      // This is a known swagger-ui bug, where the suggested fix is to make sure paths appears before components.
      // Reference links below:
      // - https://github.com/swagger-api/swagger-ui/issues/5972
      // - https://github.com/swagger-api/swagger-js/issues/1394
      // - https://github.com/swagger-api/swagger-editor/issues/2765
      const objectOrder = {
        paths: null,
        components: null,
      };
      const modifiedOrderObject = Object.assign(objectOrder, swaggerObject);
      // eslint-disable-next-line dot-notation
      modifiedOrderObject.components.schemas['Date'] = {
        type: 'string', format: 'date-time', description: 'Date format', example: '2024-03-27T14:44:18.041Z',
      };
      req.swaggerDoc = modifiedOrderObject;
      next();
    }, swaggerUi.serve, swaggerUi.setup(undefined, options.swaggerUiOptions));
  }

  if (options.exposeApiDocs) {
    app.get(options.apiDocsPath, (req, res) => {
      res.json({
        ...swaggerObject,
        // we skipped this as is not a valid prop in OpenAPI
        // This is only being used in the SwaggerUI Library
        host: undefined,
      });
    });
  }

  return instance;
};

module.exports = expressJSDocSwagger;
