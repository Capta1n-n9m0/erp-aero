import { Router } from 'express';
import { celebrate, errors, Joi } from 'celebrate';
import dataSource from 'db/app-data-source';
import { User } from 'db/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import env from 'misc/environment';
import { IJwtPayload } from 'misc/jwt.payload.interface';


const authRouter = Router();

authRouter.post('/signin', celebrate(
  {
    body: {
      id: Joi.number().required(),
      password: Joi.string().required(),
    }
  }
), async (req, res) => {
  const { id, password } = req.body;
  const userRepo = dataSource.getRepository(User);

  const user = await userRepo.findOneBy({ id, password });
  if (!user) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const payload: IJwtPayload = { id: user.id };
  const tokens = {
    accessToken: jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' }),
    refreshToken: jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: '1w' }),
  }

  res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
  res.send({ msg: 'OK', data: tokens, error: null });
});

authRouter.post('/signup/new_token', celebrate(
  {
    cookies: {
      refreshToken: Joi.string().required(),
    }
  }
), async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  let id: string;
  try {
    id = (jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as IJwtPayload).id;
  } catch (error) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  const tokens = {
    accessToken: jwt.sign({ id: user.id }, env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' }),
  }

  res.cookie('refreshToken', refreshToken, { httpOnly: true });
  res.send({ msg: 'OK', data: tokens, error: null });
});


authRouter.use(errors());
export default authRouter;

