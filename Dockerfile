FROM node:0.10
WORKDIR /mnt
ADD programs/*.tar.gz .
RUN cd bundle/programs/server && npm install
CMD node bundle/main.js
