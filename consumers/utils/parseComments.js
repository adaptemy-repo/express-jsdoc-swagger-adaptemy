const parseCommentWithUrlPropsAsKeys = comment => {
  const typedefMatch = comment.match(/}}\s*([\w]+)/);
  const typedefName = typedefMatch ? typedefMatch[1] : 'UnknownType';
  const res = comment.replace(/@typedef\s+\{\{\[/, '@typedef {{\n * [') // add a newline between typedef and first property
    .replace(/\/\/\s+/gm, '-') // Remove any instances of comments which are used to make linting work
    .replace(/--/g, '-') // Remove double hyphen if exists
    .replace(/@typedef\s+\{\{/, `@typedef {object} ${typedefName}`) // Convert to standard typedef
    .replace(/}}\s*[\w]+/, '') // Remove old typedef name
    .replace(/https:\/\//g, 'https')
    // .replace(/\['([^']+)'\]:\s*([^,}\n]+)([^}]*),?/g, '@property {$2} $1$3')
    .replace(/\[\s*'([^']+)'\s*\]\s*:\s*([^-\n]+)\s*-\s*(.*)/g, // property with description
      (_match, prop, type, desc) => `@property {${type.replace(',', '').trim()}} ${prop} - ${desc.trim()}`)
    .replace(/\[\s*'([^']+)'\s*\]\s*\?:\s*([^-\n]+)\s*-\s*(.*)/g, // property with description and is optional
      (_match, prop, type, desc) => `@property {${type.replace(',', '').trim()}=} ${prop} - ${desc.trim()}`)
    .replace(/\[\s*'([^']+)'\s*\]\s*:\s*([^-\n]+)/g, // property without description
      (_match, prop, type) => `@property {${type.replace(',', '').trim()}} ${prop}`)
    .replace(/\[\s*'([^']+)'\s*\]\s*\?:\s*([^-\n]+)/g, // property without description and is optional
      (_match, prop, type) => `@property {${type.replace(',', '').trim()}=} ${prop}`)
    .replace(/,\s*$/gm, ''); // remove commas at end of line
  return res;
};

module.exports = {
  parseCommentWithUrlPropsAsKeys,
};
