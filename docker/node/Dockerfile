FROM ubuntu:bionic

COPY install.sh /root/install.sh
COPY dev.sh /root/dev.sh

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y bash curl
RUN bash /root/install.sh

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY start.sh /usr/local/bin/start.sh

ENTRYPOINT ["bash", "docker-entrypoint.sh"]

EXPOSE 55003
EXPOSE 55055
EXPOSE 55002

CMD [ "bash",  "start.sh" ]
