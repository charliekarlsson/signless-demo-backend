const sanitize = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const slugify = (value) => {
  if (!value) return '';
  return sanitize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 48);
};

export default slugify;
