import { app } from 'app';
import env from 'misc/environment';
import dataSource from 'db/app-data-source';
import passport from 'passport';
import { jwtAuth } from 'middleware/jwt-auth';


async function bootstrap(){

  await dataSource.initialize();

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  passport.use('jwt', jwtAuth);

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

