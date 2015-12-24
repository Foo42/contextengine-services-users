FROM node
COPY . /src
WORKDIR /src
RUN date > imageBuildTime.txt
EXPOSE 9005
ENV NODE_ENV production
CMD ["node", "."]
