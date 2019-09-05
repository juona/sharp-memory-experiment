# syntax=docker/dockerfile:1.0.0-experimental

# Starting image
FROM node:10-alpine

# Set a work directory
WORKDIR /usr/src/podbase-generator-experiment-2

# RUN apt-get update && apt-get install --force-yes -yy \
#   libjemalloc1 \
#   && rm -rf /var/lib/apt/lists/*

# # Change memory allocator to avoid leaks
# ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.1

# Get source code and install dependencies
COPY . .
RUN npm i

# Configure and launch the server
CMD ["npm", "run", "test", "composite", "2"]