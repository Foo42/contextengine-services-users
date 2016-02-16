FROM node
COPY package.json ./
RUN npm install
COPY . /src
WORKDIR /src
EXPOSE 9120
CMD ["node", "."]
