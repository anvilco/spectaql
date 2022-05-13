FROM node:14-alpine

RUN mkdir spectaql
COPY . ./spectaql
WORKDIR ./spectaql/

RUN yarn clean-build 

ENTRYPOINT ["node", "bin/spectaql"]