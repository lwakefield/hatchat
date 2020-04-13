FROM postgres:12.2-alpine as postgres

FROM node:13.12.0-alpine3.11

WORKDIR /app

RUN apk add sudo

COPY --from=postgres / /
ENV PGDATA=/var/lib/postgresql/data

COPY *.js package.json yarn.lock /app/
COPY routes /app/routes

RUN yarn

ADD entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT [ "entrypoint.sh" ]
CMD ["run"]
