# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia el package.json y package-lock.json (si existe)
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Construye la aplicación (compila TypeScript a JavaScript)
RUN npm run build

# Expone el puerto en el que la API estará escuchando
EXPOSE 3000

# Comando para iniciar la aplicación en modo producción
CMD ["npm", "run", "start:prod"]