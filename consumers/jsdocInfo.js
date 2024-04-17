const doctrine = require('doctrine');

const convertTagToAllOfUnionType = tag => {
  const elementsToCombine = tag.type.name.split('&').map(t => ({ type: 'NameExpression', name: t }));
  const elements = [{ type: 'NameExpression', name: 'allOf' }, ...elementsToCombine];
  const tagType = {
    type: 'UnionType',
    elements,
  };
  const modifiedTag = JSON.parse(JSON.stringify(tag));
  modifiedTag.type = tagType;
  return modifiedTag;
};

const jsdocInfo = (options = { unwrap: true }) => comments => {
  if (!comments || !Array.isArray(comments)) return [];
  return comments.map(comment => {
    let modifiedComment = comment;
    if (comment.includes('@extends')) {
      const itemsToExtend = comment.match(/(@extends\s{[\s\S]*?})/g).map(i => i.replace('@extends {', '').replace('}', ''));
      modifiedComment = comment
        .replace(/@typedef\s{object/g, `@typedef {allOf|${itemsToExtend.join('|')}`)
        .replace(/(@extends\s{[\s\S]*?})/g, '');
    }
    const parsedValue = doctrine.parse(modifiedComment, options);
    const tags = parsedValue.tags.map(tag => ({
      ...tag,
      description: tag.description ? tag.description.replace('\n/', '').replace(/\/$/, '') : tag.description,
    }));
    const tagsSupportingAllOfUnionType = tags.map(t => (!t.type?.name?.includes('&') ? t : convertTagToAllOfUnionType(t)));
    const description = parsedValue.description.replace('/**\n', '').replace('\n/', '');
    return {
      ...parsedValue,
      tags: tagsSupportingAllOfUnionType,
      description,
    };
  });
};

module.exports = jsdocInfo;
