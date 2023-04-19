# Specify the base image
FROM node:16-alpine

# Set the NODE_ENV environment variable to "production"
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# run prisma migrations
RUN npx prisma migrate deploy

# Expose the port that the API will listen on
EXPOSE 3000

# Start the API
CMD ["node", "index.js"]
