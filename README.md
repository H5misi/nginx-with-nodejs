# nginx-with-nodejs

### Main configurations 

- Main config file + per-site config:\
`/etc/nginx/`


- Access and error logs:\
`/var/log/nginx/`


- Command that tests config syntax and check file references exist:\
`sudo nginx -t`

- Command that reload config (not restart):\
`sudo systemctl reload nginx`


- Nginx configuration files path:\
`/etc/nginx/sites-available/`

---
- Create a new Nginx configuration file:\
`sudo nano /etc/nginx/sites-available/nginx`

Inside it add:

```
server {
  listen 80 default_server;
  listen [::]:80 default_server;

  server_name _;

  location / {
      proxy_pass http://127.0.0.1:3000;

      proxy_http_version 1.1;

      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
}
  ```



* To access Node.js through Nginx or Node.js directly:\
http://localhost       → Nginx → Node.js\
http://localhost:3000  → Node.js directly



---
### Layer 4 & Layer 7 proxy:
1. Layer 4 (Transport layer): Determine forwarding rules based on:
    1. IP address (source and destination)
    2. Port (e.g.: port 80 for HTTP, port 443 for HTTPS)
    3. Protocol type (TCP  or UDP)
  
3. Layer 7 (Application layer): Determine forwarding rules based on:
     1. HTTP headers (e.g.: Content-Type, ...)
     2. URL paths (e.g.: /api/v1/users vs /static/images)
     3. Cookies 
     4. HTTP methods (e.g.: GET, POST, DELETE)
 
 
---
 
## Static files sever (static files e.g. HTML, CSS, JS, images, vedios):
1. Create `/var/www/mySite/index.html`
2. Create the static file and its content.
3. Inside nginx configuration:
```
root /var/www/mySite;
index index.html;

# Static files
location /static/ {
   try_files $uri $uri/ =404;
}
```
    
`root /var/www/mySite;` -> the location that Nginx maps the URL to it.\
`index index.html;` -> if the client request GET/, Nginx looks for index.html inside the root path that is provided.

> The file `index.html` (mentioned in the index line) must be in this path (root + URI): `/var/www/mySite/static/index.html`


---
## HTTP Basic authentication with Nginx:
**first:** Create the **user : password** file:

```bash 
sudo htpasswd -c /etc/nginx/.htpasswd admin
```
`-c` :only used to create the file if not exist.\
`/etc/nginx/.htpassw` : the **user : password** file path.\
`admin` : new user added to the file.

after entering the password for this user, it's now ready. 
> to add a new user: `sudo htpasswd /etc/nginx/.htpasswd <user>`



**Second:** To enable authentication for the Nginx server:
- Nginx server configuration:\
`sudo nano /etc/nginx/sites-available/nginx`

- To require authentication for the entire server ( in the configuration root):
```
auth_basic "Authentication Required";
auth_basic_user_file /etc/nginx/.htpasswd;

# Static server
location /static/ {
        try_files $uri $uri/ =404;
    }
```
* to disable inside a specific location:
```
location /api/ {
	auth_basic off;
	.
	.
	.
}
```
    
`auth_basic "Authentication Required";` -> the text between `""` is a custom message.\
`auth_basic_user_file /etc/nginx/.htpasswd;` -> the **user : password** file path

---

## Redirect HTTP to HTTPS:
Standard approach:
1. Obtain an SSL/STL certificate (using CA (Certificate Authority), or create sefl-signed certificate)
2. Make Nginx listen to port 443 (HTTTPS)
3. Redirect all HTTP (port 80) traffic to HTTPS (port 443)\
\
\
\
1- To Obtain an SSL/STL certificate, there is two approaches:
   1. For production: use **Let's Encrypt** (free)
   2. For learning and testing on localhost: create a self-signed certificate:
```bash
sudo mkdir -p /etc/nginx/ssl

sudo openssl req -x509 -nodes -days 365 \ 
-newkey rsa:2048 \
-keyout /etc/nginx/ssl/nginx.key \
-out /etc/nginx/ssl/nginx.crt
```

1. Run `openssl` program, `req` : request certificate, `-x509` : create X.509 certificate, `-nodes` : no DES encryption for the private key, `-days 365` : certificate expire in 365 days
2. `-newkey rsa:2048` -> generate a new RSA key pair (Algorithm: RSA, key size: 2048 bits)
3. `-keyout /etc/nginx/ssl/nginx.key` -> path where the private key is saved
4. `-out /etc/nginx/ssl/nginx.crt` -> path where the generated certificate is saved



- inside `/etc/nginx/sites-available/nginx` add :
```
# HTTP server -> HTTPS redirect
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    return 301 https://$host$request_uri;
}
```
* `return 301` -> moved permanently
* `https://$host$request_uri` -> the new URL, `$host` -> Nginx variable contain the hostname, `$request_uri` -> Nginx variable contain the entire URI
```
# HTTPS server
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    server_name _;

    ssl_certificate     /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
}
```

* `ssl` parameter -> tells Nginx to expect SSL/STL traffic on this port, which is HTTPS port

* `ssl_certificate     /etc/nginx/ssl/nginx.crt;` -> using cetificate command and its path.
* `ssl_certificate_key /etc/nginx/ssl/nginx.key;` -> using the private key command and its path.


---
## Load balancing with Nginx
first: run multiple copies / instances of the same application using this command `PORT=<port number> node server.js`, in each terminal run this command with changing the port number (`3000`, `3001`, `3002`, ...etc)
 
inside Nginx configuration `/etc/nginx/sites-available/nginx` add:
```
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

location /api/ {

   auth_basic off;

   proxy_pass http://backend;

   proxy_http_version 1.1;
}
```
`proxy_pass http://backend;` -> change `proxy_pass` to the upstream group name ( `backend` here)

To test it send many requests and let Nginx handle it:
1. send every request individually:
    ```bash
    curl http://localhost:3000/health
    curl http://localhost:3001/health
    curl http://localhost:3002/health
    ```

2. test through Nginx:\
`curl -k https://localhost/api/health` \
if the request is sent multiple times in the same time, Nginx disturbs the request

3. send many requests automatically:
```bash
for i in {1..10}; do
    echo -n "Request $i -> "
    curl -sk https://localhost/api/health
    echo
done
```





