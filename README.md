# Wayne

```cmd
> npx prisma migrate dev --name init
> npx prisma migrate deploy

# generate prisma client files
> npx prisma generate
```

```sh 
eval "$(ssh-agent -s)"
ssh-add /path/to/ssh_key_file

- ssh wayne@43.250.141.98
- Wayne@987

- ssh root@43.250.141.98
- 9CEM#9fqRj6582yT
```

```
CPANEL ADDRESS
trusafe.au/cpanel

USERNAME
trusafea

PASSWORD
410L]5NLi*Hl7

CPANEL HOSTNAME
s02ce.syd5.hostingplatform.net.au:2083
```

# host mysql
```sh
docker pull mysql
docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=<password> -p 3306:3306 -d mysql
docker stop/start -d mysql-container 

CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON dbname.* TO 'username'@'localhost';
```

# deploy
```sh
sudo docker build -t wayne_app .
sudo docker run --name WAYNE_APP -p 80:3000 -e SESSION_SECRET=ccd-ewdd-ekck-ewd -e ADMIN_USERNAME=wayne -e ADMIN_PASSWORD=wayne_123 -d --restart=unless-stopped wayne_app
sudo docker run --name WAYNE_APP -p 80:3000 -e SESSION_SECRET=ccd-ewdd-ekck-ewd -e ADMIN_USERNAME=wayne -e ADMIN_PASSWORD=wayne_123 wayne_app
```