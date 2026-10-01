FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend ./
COPY database /app/database
RUN npm run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
