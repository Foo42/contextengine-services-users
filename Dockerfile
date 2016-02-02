FROM node
COPY . /src
WORKDIR /src
RUN npm install
EXPOSE 9120
CMD ["node", "."]
