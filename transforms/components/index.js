const { getTagInfo, getTagsInfo } = require('../utils/tags');
const mapDescription = require('../utils/mapDescription');
const { refSchema, formatRefSchema } = require('../utils/refSchema');
const addEnumValues = require('../utils/enumValues');
const { addClientValues, hasClientProperty, removePropertyByClient } = require('../utils/clientPropertyMethods');
const formatDescription = require('../utils/formatDescription');
const combineSchema = require('../utils/combineSchema');
const validateTypes = require('../utils/validateTypes');

const REQUIRED = 'required';

const getPropertyName = ({ name: propertyName }) => {
  const [name] = propertyName.split('.');
  return name;
};

const addTypeApplication = (applications, expression) => {
  if (!applications && !expression) return {};

  if (applications) {
    return {
      type: expression.name.toLowerCase(),
      items: {
        type: applications[0].name,
      },
    };
  }
  if (expression.name) {
    const isPrimitive = validateTypes(expression.name.toLowerCase());
    return (isPrimitive ? { type: expression.name.toLowerCase() } : { $ref: `#/components/schemas/${expression.name}` });
  }
  if (!expression.name && expression.applications) {
    const isPrimitive = validateTypes(expression.applications[0].name);
    return {
      type: expression.expression.name.toLowerCase(),
      items: isPrimitive
        ? { type: expression.applications[0].name.toLowerCase() }
        : { $ref: `#/components/schemas/${expression.applications[0].name}` },
    };
  }
  if (expression.type === 'UnionType') {
    return {
      ...combineSchema(expression.elements),
    };
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled swagger type encountered, notify aimee if you see this warning.');
  return {};
};

const addRefSchema = (typeName, applications, elements) => {
  if (!typeName && !elements && applications) return { items: formatRefSchema(applications) };
  return {};
};

const formatProperties = (properties, options = {}) => {
  if (!properties || !Array.isArray(properties)) return {};
  return properties.reduce((acum, property) => {
    const name = getPropertyName(property);
    const isRequired = property.name.includes(REQUIRED) || property.type?.type !== 'OptionalType';
    const {
      name: typeName, applications, expression, elements,
    } = property.type;
    const propertyExpression = property.type?.type === 'OptionalType' ? property.type?.expression : expression;
    const [descriptionValue, enumValues, clientValues, jsonOptions] = formatDescription(property.description);
    const [description, format] = mapDescription(descriptionValue);
    return {
      ...acum,
      [name]: {
        description,
        ...refSchema(typeName),
        ...combineSchema(elements),
        ...addTypeApplication(applications, propertyExpression),
        ...addRefSchema(typeName, applications, elements),
        ...(format && !clientValues ? { format } : {}),
        ...addEnumValues(enumValues),
        ...addClientValues(clientValues),

        // Add nullable to non-required fields if option to do that is enabled
        ...(options.notRequiredAsNullable && !isRequired ? {
          nullable: true,
        } : {}),
        ...(jsonOptions || {}),
      },
    };
  }, {});
};

const getRequiredProperties = properties => (
  properties.filter(({ name, type }) => name.includes(REQUIRED) || type?.type !== 'OptionalType')
);

const formatRequiredProperties = requiredProperties => requiredProperties.map(getPropertyName);

const addDictionaryAdditionalProperties = typedef => {
  if (
    typedef.type.expression
    && typedef.type.expression.name === 'Dictionary'
  ) {
    const typeName = typedef.type.applications[0].name;
    const isPrimitive = validateTypes(typeName);

    return {
      additionalProperties: {
        ...(isPrimitive ? { type: typeName } : { $ref: `#/components/schemas/${typeName}` }),
      },
    };
  }

  return {};
};

const parseSchema = (schema, options = {}) => {
  const typedef = getTagInfo(schema.tags, 'typedef');
  const propertyValues = getTagsInfo(schema.tags, 'property');
  const requiredProperties = getRequiredProperties(propertyValues);
  const [descriptionValue, enumValues, clientValues, jsonOptions] = formatDescription(schema.description);
  const [description, format] = mapDescription(descriptionValue);
  if (clientValues !== undefined) {
    console.error(`TODO: add support for clients: ${JSON.stringify(clientValues)}; tell aimee if you see this error`);
  }
  if (!typedef || !typedef.name) return {};
  const {
    elements,
  } = typedef.type;
  const type = typedef.type.name || 'object';
  let formattedProperties = formatProperties(propertyValues, options);
  if (options.client && hasClientProperty(formattedProperties)) {
    formattedProperties = removePropertyByClient(formattedProperties, options.client);
  }
  return {
    [typedef.name]: {
      ...combineSchema(elements),
      description,
      ...(requiredProperties.length ? {
        required: formatRequiredProperties(requiredProperties),
      } : {}),
      type,
      ...(type === 'object' ? {
        properties: formattedProperties,
      } : {}),
      ...(format ? { format } : {}),
      ...addEnumValues(enumValues),
      ...addDictionaryAdditionalProperties(typedef),
      ...(jsonOptions || {}),
    },
  };
};

const parseComponents = (swaggerObject = {}, components = [], options = {}) => {
  if (!components || !Array.isArray(components)) return { components: { schemas: {} } };
  const componentSchema = components.reduce((acum, item) => ({
    ...acum, ...parseSchema(item, options),
  }), {});
  return {
    ...swaggerObject,
    components: {
      ...swaggerObject.components,
      schemas: componentSchema,
    },
  };
};

module.exports = parseComponents;
