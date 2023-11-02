import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as uuid from 'uuid';
import dataSource from 'db/app-data-source';
import { File } from 'db/entities/file.entity';
import passport from 'passport';


const folder = path.join(process.cwd(), 'uploads');

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
const fileRouter = Router();

fileRouter.post('/upload', passport.authenticate('jwt'), upload.single('file'),
  async (req, res) => {
    const file = req.file;
    // save file info to database

    const fileRepo = dataSource.getRepository(File);

    let newFile = new File();

    newFile.name = file.originalname;
    newFile.extension = path.extname(file.originalname);
    newFile.size = file.size;
    newFile.mimetype = file.mimetype;

    try {
      newFile = await fileRepo.save(newFile);
    } catch (error) {
      res.status(500).send({ msg: 'Internal Server Error', status: 500, data: null, error: error.message });
    }

    res.send({ msg: 'OK', data: newFile, error: null });
});



export default fileRouter;