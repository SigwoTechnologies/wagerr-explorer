FROM node:9
WORKDIR /explorer
RUN apt-get update
RUN apt-get install -y cron
RUN apt-get install -y bash curl
RUN npm cache clean --force
RUN npm install -g webpack
RUN npm install -g webpack-cli

COPY package.json /explorer
#COPY docker/node/install.sh /root/install.sh
#COPY docker/node/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN yarn install
RUN npm install

COPY . .

ADD crontab /etc/cron.d/hello-cron
RUN chmod 0644 /etc/cron.d/hello-cron
RUN crontab /etc/cron.d/hello-cron
RUN touch /var/log/cron.log

EXPOSE 8087
EXPOSE 8081

CMD ["script/start.sh"]
