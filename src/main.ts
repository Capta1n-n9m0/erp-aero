import { app } from 'app';
import env from 'misc/environment';
import dataSource from 'db/app-data-source';


async function bootstrap(){

  await dataSource.initialize();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
    console.log(`http://localhost:${env.port}`);
  });

  app.get('/',(req, res) => {
    res.redirect('/hello-world');
  });
}

bootstrap().then(()=>{
  console.log("Startup complete");
}).catch((e) => {
  throw e;
})

