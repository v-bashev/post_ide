# syntax=docker/dockerfile:1

FROM ubuntu

ENV NODE_ENV=production

ENV TZ=Asia/Novosibirsk
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt update
RUN apt install default-jre npm curl -y
RUN npm install n -g
RUN n 10.24.1
RUN npm install yarn@1.7.0 -g

WORKDIR /src
COPY . .

RUN mkdir /poST-IDE-workspaces

CMD ./run-backend.sh 0.0.0.0 3000 /poST-IDE-workspaces

EXPOSE 3000
