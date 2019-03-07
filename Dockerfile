FROM node:9
WORKDIR /explorer
RUN apt-get update
RUN apt-get install -y cron
RUN npm cache clean --force
RUN npm install -g webpack
RUN npm install -g webpack-cli
COPY package.json /explorer
RUN yarn install
RUN npm install
COPY . .
RUN script/wagerrd_testnet_setup_docker.sh
ADD crontab /etc/cron.d/hello-cron
RUN chmod 0644 /etc/cron.d/hello-cron
RUN crontab /etc/cron.d/hello-cron
RUN touch /var/log/cron.log
EXPOSE 8087
EXPOSE 8081
EXPOSE 55005
EXPOSE 8332
CMD ["script/start.sh"]
