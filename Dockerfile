FROM node
COPY package.json /src/
WORKDIR /src
RUN npm install
COPY . /src
EXPOSE 9120
CMD ["node", "."]
