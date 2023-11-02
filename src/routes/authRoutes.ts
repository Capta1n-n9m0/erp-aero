import { Router } from 'express';
import { celebrate, errors, Joi } from 'celebrate';
import dataSource from 'db/app-data-source';
import { User } from 'db/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import env from 'misc/environment';
import { IJwtPayload } from 'misc/jwt.payload.interface';
import { blacklist, isBlacklisted } from 'misc/redis-client';
import passport from 'passport';


const authRouter = Router();

authRouter.post('/signin', celebrate(
  {
    body: {
      id: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
), async (req, res) => {
  const { id, password } = req.body;
  const userRepo = dataSource.getRepository(User);

  const user = await userRepo.findOneBy({ id, password });
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const payload: IJwtPayload = { id: user.id };
  const tokens = {
    accessToken: jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_LIFE }),
    refreshToken: jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_LIFE }),
  };

  res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
  res.send({ msg: 'OK', data: tokens, error: null });
});

authRouter.post('/signup/new_token', celebrate(
  {
    cookies: {
      refreshToken: Joi.string().required(),
    },
  },
), async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  let id: string;
  try {
    id = (jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as IJwtPayload).id;
  } catch (error) {
    return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  if (await isBlacklisted(refreshToken)) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const tokens = {
    accessToken: jwt.sign({ id: user.id }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_LIFE }),
  };

  res.cookie('refreshToken', refreshToken, { httpOnly: true });
  return res.send({ msg: 'OK', data: tokens, error: null });
});

authRouter.post('/signup', celebrate(
  {
    body: {
      id: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
), async (req, res) => {
  const { id, password } = req.body;
  const userRepo = dataSource.getRepository(User);


  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = userRepo.create({ id, password: hashedPassword });
  try {
    await userRepo.save(user);
  } catch (error) {
    return res.status(409).send({ msg: 'Conflict', status: 409, data: null, error: null });
  }

  const payload: IJwtPayload = { id: user.id };
  const tokens = {
    accessToken: jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_LIFE }),
    refreshToken: jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_LIFE }),
  };

  res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
  return res.send({ msg: 'OK', data: tokens, error: null });
});

authRouter.post('/logout', celebrate(
  {
    cookies: {
      refreshToken: Joi.string().required(),
    },
    headers: {
      authorization: Joi.string().required(),
    },
  },
), async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const authHeader = req.headers.authorization;
  const accessToken = authHeader.split(' ')[1];

  let id: string;
  try {
    id = (jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as IJwtPayload).id;
  } catch (error) {
    return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  try {
    await blacklist(accessToken, env.ACCESS_TOKEN_LIFE);
    await blacklist(refreshToken, env.REFRESH_TOKEN_LIFE);
  } catch (error) {
    return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: null });
  }

  res.clearCookie('refreshToken');
  return res.send({ msg: 'OK', data: null, error: null });
});

authRouter.get('/info', celebrate(
    {
      headers: {
        authorization: Joi.string().required(),
      },
    },
  ), passport.authenticate('jwt'),
  async (req, res) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader.split(' ')[1];

    let id: string;
    try {
      id = (jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET) as IJwtPayload).id;
    } catch (error) {
      return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
    }

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id });
    if (!user) {
      return res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
    }

    return res.send({ msg: 'OK', data: { id }, error: null });
});

authRouter.use(errors());
export default authRouter;

