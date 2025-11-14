export const getValueAtPath = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, obj);
};

export const setValueAtPath = (obj, path, value) => {
  const segments = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = clone;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }

    const next = current[segment];
    if (Array.isArray(next)) {
      current[segment] = [...next];
    } else if (typeof next === 'object' && next !== null) {
      current[segment] = { ...next };
    } else {
      current[segment] = {};
    }

    current = current[segment];
  });

  return clone;
};

export const mergeDeep = (target, source) => {
  if (typeof source !== 'object' || source === null) {
    return source;
  }

  const output = Array.isArray(target) ? [...target] : { ...target };

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = output[key];

    if (Array.isArray(sourceValue)) {
      output[key] = sourceValue.map((item, index) => {
        if (typeof item === 'object' && item !== null && Array.isArray(targetValue)) {
          return mergeDeep(targetValue[index] ?? {}, item);
        }
        return item;
      });
      return;
    }

    if (typeof sourceValue === 'object' && sourceValue !== null) {
      output[key] = mergeDeep(targetValue ?? {}, sourceValue);
      return;
    }

    output[key] = sourceValue;
  });

  return output;
};
