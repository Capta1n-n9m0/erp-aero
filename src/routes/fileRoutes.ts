import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import dataSource from 'db/app-data-source';
import { File } from 'db/entities/file.entity';
import passport from 'passport';
import { celebrate, errors, Joi } from 'celebrate';
import env from 'misc/environment';
import * as fsp from 'fs/promises';

const folder = path.join(process.cwd(), env.FILE_UPLOAD_PATH);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = uuid.v4();
    const extension = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, extension)}-${unique}${extension}`);
  }
});
const upload = multer({ storage });
export const fileRouter = Router();

fileRouter.post('/upload', passport.authenticate('jwt'), upload.single('file'),
  async (req, res) => {
    const file = req.file;
    // save file info to database

    const fileRepo = dataSource.getRepository(File);

    let newFile = new File();

    newFile.name = file.originalname;
    newFile.path = file.filename;
    newFile.extension = path.extname(file.originalname);
    newFile.size = file.size;
    newFile.mimetype = file.mimetype;

    try {
      newFile = await fileRepo.save(newFile);
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    return res.send({ msg: 'OK', data: newFile, error: null });
});

fileRouter.get('/list', passport.authenticate('jwt'), celebrate(
  {
    query: {
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).default(10),
    }
  }
), async (req, res) => {
  const page = +req.query.page;
  const limit = +req.query.limit;

  const fileRepo = dataSource.getRepository(File);

  let files: File[];
  try {
    files = await fileRepo.find({
      skip: (page - 1) * limit,
      take: limit,
    });
  } catch (error) {
    return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
  }

  return res.send({ msg: 'OK', data: files, error: null });
});

fileRouter.delete('/delete/:id', passport.authenticate('jwt'), celebrate(
  {
    params: {
      id: Joi.number().min(1).required(),
    }
  }), async (req, res) => {
    const id = +req.params.id;

    const fileRepo = dataSource.getRepository(File);

    let file: File;
    try {
      file = await fileRepo.findOneBy({ id });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    if (!file) {
      return res.status(404).send({ msg: 'Not Found', status: 404, data: null, error: null });
    }

    try {
      await dataSource.transaction(async (manager) => {
        await manager.remove(file);
        await fsp.unlink(path.join(folder, file.path));
      });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    return res.send({ msg: 'OK', data: null, error: null });
});

fileRouter.get('/:id', passport.authenticate('jwt'), celebrate(
  {
    params: {
      id: Joi.number().min(1).required(),
    }
  }), async (req, res) => {
    const id = +req.params.id;

    const fileRepo = dataSource.getRepository(File);

    let file: File;
    try {
      file = await fileRepo.findOneBy({ id });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    if (!file) {
      return res.status(404).send({ msg: 'Not Found', status: 404, data: null, error: null });
    }

    res.send({ msg: 'OK', data: file, error: null });
});

fileRouter.get('/download/:id', passport.authenticate('jwt'), celebrate(
  {
    params: {
      id: Joi.number().min(1).required(),
    }
  }), async (req, res) => {
    const id = +req.params.id;

    const fileRepo = dataSource.getRepository(File);

    let file: File;
    try {
      file = await fileRepo.findOneBy({ id });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    if (!file) {
      return res.status(404).send({ msg: 'Not Found', status: 404, data: null, error: null });
    }

    return res.download(path.join(folder, file.path), file.name, (err) => {
      if (err) {
        res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: err.message });
      }
    });
});

fileRouter.put('/update/:id', passport.authenticate('jwt'), upload.single('file'), celebrate(
  {
    params: {
      id: Joi.number().min(1).required(),
    }
  }), async (req, res) => {
    const id = +req.params.id;
    const file = req.file;

    const fileRepo = dataSource.getRepository(File);

    let oldFile: File;
    try {
      oldFile = await fileRepo.findOneBy({ id });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    if (!oldFile) {
      return res.status(404).send({ msg: 'Not Found', status: 404, data: null, error: null });
    }
    try {
      await dataSource.transaction(async (manager) => {
        const oldFilePath = path.join(folder, oldFile.path);

        oldFile.name = file.originalname;
        oldFile.path = file.filename;
        oldFile.extension = path.extname(file.originalname);
        oldFile.size = file.size;
        oldFile.mimetype = file.mimetype;
        oldFile = await manager.save(oldFile);

        await fsp.unlink(oldFilePath);
      });
    } catch (error) {
      return res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    return res.send({ msg: 'OK', data: oldFile, error: null });
});



fileRouter.use(errors());
export default fileRouter;