import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import logger from 'morgan';
import helmet from 'helmet';
import { authRouter } from 'routes/authRoutes';
import { fileRouter } from 'routes/fileRoutes';

function handleErrors(err, req, res, next) {
  res.status(err.status || 500).send({ msg: err.message, status: err.status || 500, data: null, error: err.message });
}

export const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(handleErrors);


app.use(authRouter);
app.use('/file', fileRouter);

app.get('/hello-world', (req, res) => {
  res.send({msg: 'Hello World!', status: 200, data: "Hello World!", error: null});
});



