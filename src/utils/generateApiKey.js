import { randomBytes } from 'node:crypto';

const generateApiKey = () => {
  const raw = randomBytes(24).toString('base64url');
  return `x4z_${raw}`;
};

export default generateApiKey;
