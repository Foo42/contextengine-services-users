FROM node
RUN ["npm", "install", "supervisor", "-g"]
COPY . /src
WORKDIR /src
EXPOSE 9005
ENV NODE_ENV production
CMD ["supervisor", "."]
