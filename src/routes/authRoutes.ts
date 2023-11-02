import { Router } from 'express';
import { celebrate, errors, Joi } from 'celebrate';
import dataSource from 'db/app-data-source';
import { User } from 'db/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import env from 'misc/environment';


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

  const tokens = {
    accessToken: jwt.sign({ id: user.id }, env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' }),
    refreshToken: jwt.sign({ id: user.id }, env.REFRESH_TOKEN_SECRET, { expiresIn: '1w' }),
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

  let id: string | number;
  try {
    id = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as string;
  } catch (error) {
    res.status(401).send({ msg: 'Unauthorized', status: 401, data: null, error: null });
  }

  id = parseInt(id as string);
  if(!id) {
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

