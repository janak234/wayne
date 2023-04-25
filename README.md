# Wayne

```cmd
> npx prisma migrate dev --name init
> npx prisma migrate deploy

# generate prisma client files
> npx prisma generate
```

# host mysql
```sh
docker pull mysql
docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=<password> -p 3306:3306 -d mysql
docker stop/start mysql-container 

CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON dbname.* TO 'username'@'localhost';
```

# deploy
```sh
sudo docker build -t wayne_app .
sudo docker run --name WAYNE_APP -p 80:3000 -d --restart=unless-stopped wayne_app
```