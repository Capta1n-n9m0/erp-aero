import express from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import logger from 'morgan';
import helmet from 'helmet';
import dataSource from 'db/app-data-source';



export const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/hello-world', (req, res) => {
  res.send({msg: 'Hello World!', status: 200, data: "Hello World!", error: null});
});


