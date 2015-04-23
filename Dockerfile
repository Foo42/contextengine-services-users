FROM node
COPY . /src
WORKDIR /src
RUN ["npm", "install"]
RUN ["npm", "install", "supervisor", "-g"]
EXPOSE 9005
ENV NODE_ENV production
CMD ["supervisor", "."]
