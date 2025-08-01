# Usar una imagen base de Node.js ligera
FROM node:18-alpine

# Crear el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias y luego instalarlas
# Esto aprovecha el cache de Docker para no reinstalar si no cambian
COPY package*.json ./
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# El servidor de Express corre en el puerto 3001 por defecto
EXPOSE 3001

# El comando para iniciar la aplicación
CMD ["npm", "start"]
