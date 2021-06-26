## File Examples

- File Upload

**upload by chunk**
![upload](./docs/upload.gif)

**upload in second**
![upload in second](./docs/upload2.gif)

- File Download

🤮🤮🤮 **I don't want to write template code with jquery anymore.**

### Tech Stack
- node
- express
- sequelize
- tailwind css
- jquery
- ejs
- webpack
- docker
- heroku

### Run

```shell
chmod -R +x ./scripts
```

- Local
```shell
npm run db:start
npm run build:watch
npm start

# stop db
npm run db:stop
```

- Prod
```shell
npm run start:prod

# down
npm run stop:prod
```

- Heroku

1. create `heroku.yml`

```yaml
build:
  docker:
    web: Dockerfile
run:
  web: npm run start:heroku
```

2. modify `package.json`

```json
{
  "scripts": {
    "start:heroku": "NODE_ENV=heroku node ./bin/www"
  }
}
```

3. deploy to heroku

```shell
# create heroku repos
heroku create files-examples
heroku stack:set container 

# when add addons, remind to config you billing card in heroku [important]
# add mysql addons
heroku addons:create cleardb:ignite 
# get mysql connection url
heroku config | grep CLEARDB_DATABASE_URL
# will echo => DATABASE_URL: mysql://xxxxxxx:xxxxxx@xx-xxxx-east-xx.cleardb.com/heroku_9ab10c66a98486e?reconnect=true

# set mysql database url
heroku config:set DATABASE_URL='mysql://xxxxxxx:xxxxxx@xx-xxxx-east-xx.cleardb.com/heroku_9ab10c66a98486e?reconnect=true'

# add heroku.js to src/db/config folder
# use the DATABASE_URL which you get form prev step to config the js file
module.exports = {
  HOST: 'xx-xxxx-east-xx.cleardb.com',
  USER: 'xxxxxxx',
  PASSWORD: 'xxxxxx',
  DATABASE: 'heroku_9ab10c66a98486e',
};

# push source code to remote
git push heroku master
```