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

CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON dbname.* TO 'username'@'localhost';
```