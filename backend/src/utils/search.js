export const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeSearchText = (value = '') => String(value)
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const normalizeSearchQuery = (value = '') => {
  const trimmed = String(value).trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return [];
  }

  return [...new Set(trimmed.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean))].slice(0, 6);
};

export const createSearchQuery = (value = '', fields = []) => {
  const terms = normalizeSearchQuery(value);

  if (!terms.length || !fields.length) {
    return {};
  }

  return {
    $or: terms.map((term) => ({
      $or: fields.map((field) => ({
        [field]: { $regex: escapeRegExp(term), $options: 'i' },
      })),
    })),
  };
};

export const scoreSearchDocument = (doc, terms = [], fields = []) => {
  const normalizedTerms = Array.isArray(terms) ? terms : normalizeSearchQuery(terms);
  if (!normalizedTerms.length) return 0;
  const searchTerms = normalizedTerms.map((term) => normalizeSearchText(term)).filter(Boolean);

  const fieldValues = fields.flatMap((field) => {
    const value = doc?.[field];
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  });

  const haystack = normalizeSearchText(fieldValues.join(' '));
  const name = normalizeSearchText(doc?.name || '');
  const category = normalizeSearchText(doc?.category || '');
  const queryPhrase = normalizeSearchText(normalizedTerms.join(' '));

  let score = 0;

  if (queryPhrase && haystack.includes(queryPhrase)) {
    score += 35;
  }

  if (queryPhrase && name.includes(queryPhrase)) {
    score += 30;
  }

  for (const term of searchTerms) {
    if (!term) continue;
    if (haystack.includes(term)) score += 12;
    if (name.includes(term)) score += 8;
    if (name.startsWith(term)) score += 6;
    if (category.includes(term)) score += 4;
  }

  if (searchTerms.every((term) => name.includes(term))) {
    score += 20;
  }

  return score;
};

export const sortSearchResults = (docs = [], terms = [], fields = []) => {
  const scored = docs
    .map((doc) => ({
      doc,
      score: scoreSearchDocument(doc, terms, fields),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const rightTime = new Date(right.doc.createdAt || 0).getTime();
      const leftTime = new Date(left.doc.createdAt || 0).getTime();
      return rightTime - leftTime;
    });

  return scored.map(({ doc }) => doc);
};