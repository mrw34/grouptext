FROM node:0.10
WORKDIR /mnt
ADD programs/*.tar.gz .
RUN cd bundle/programs/server && npm install
ENV PORT 3000
EXPOSE 3000
CMD node bundle/main.js
