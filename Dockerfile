FROM node:lts

COPY package.json ./
RUN npm install

copy index.js ./
RUN apt install -y git
RUN apt-get -y -qq update && \
	apt-get install -y -qq curl && \
	apt-get clean
#
# install jq to parse json within bash scripts
RUN curl -o /usr/local/bin/jq http://stedolan.github.io/jq/download/linux64/jq && \
  chmod +x /usr/local/bin/jq

ENTRYPOINT [ "node", "/index.js" ]
