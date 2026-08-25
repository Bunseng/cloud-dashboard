# ------------------------------------------------------------------ #
# CloudPlus dashboard-ui — static Vite/React SPA.
#
# Stage 1 builds the app with Node (needs devDependencies); stage 2
# serves only the built dist/ output with nginx, so the final image
# ships no source, no node_modules, no build toolchain — just static
# files plus a tiny web server. Exposes port 80: point Run App's
# service port at 80 (or set it to read $PORT if your platform
# requires a non-80 port — see the note in nginx.conf).
# ------------------------------------------------------------------ #

FROM node:20-alpine AS build
WORKDIR /app

# Installed separately from the rest of the source so this layer is
# only invalidated when package.json/lockfile actually change.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
