import * as jwt from 'jsonwebtoken';
import { IJwtPayload } from 'misc/jwt.payload.interface';
import passportCustom from 'passport-custom';
import { isBlacklisted } from 'misc/redis-client';

const CustomStrategy = passportCustom.Strategy;

export const jwtAuth = new CustomStrategy(
  async (req, done) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return done(null, false);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return done(null, false);
    }

    let payload: IJwtPayload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as IJwtPayload;
    } catch (error) {
      return done(null, false);
    }

    if(await isBlacklisted(token)) {
      return done(null, false);
    }

    return done(null, payload);
  }
);

