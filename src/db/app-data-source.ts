import { DataSource } from "typeorm"
import env from "misc/environment"
import { User } from 'db/entities/user.entity';
import { File } from 'db/entities/file.entity';

console.log(env.db);

const dataSource = new DataSource({
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  entities: [User, File],
  logging: env.dev,
  synchronize: env.dev,
});

export default dataSource;