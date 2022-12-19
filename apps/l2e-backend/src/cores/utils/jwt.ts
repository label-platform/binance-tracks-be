import jwt from 'jsonwebtoken';

export const generateAccessJWT = (data, options = {}) => {
  const key = process.env.ACCESS_JWT_SECRET_KEY;
  return jwt.sign(data, key, options);
};

export const verifyAccessJWT = (token: string, options = {}) => {
  const key = process.env.ACCESS_JWT_SECRET_KEY;
  return jwt.verify(token, key, options);
};

export const generateRefreshJWT = (data, options = {}) => {
  const key = process.env.REFRESH_JWT_SECRET_KEY;
  return jwt.sign(data, key, options);
};

export const verifyRefreshJWT = (token: string, options = {}) => {
  const key = process.env.REFRESH_JWT_SECRET_KEY;
  return jwt.verify(token, key, options);
};
