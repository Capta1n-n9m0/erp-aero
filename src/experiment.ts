import * as jwt from 'jsonwebtoken';

import env from 'misc/environment';

function generateAccessToken(id: string) {
  return jwt.sign({ id }, env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
}

function verifyAccessToken(token: string) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}


const token = generateAccessToken('1234');
console.log(token);
console.log(verifyAccessToken(token));