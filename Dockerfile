ARG DIRECTUS_VERSION=9.0.0-rc.91

FROM directus/directus:${DIRECTUS_VERSION}

USER node
WORKDIR /directus

#Suposem que previament ja hem compilat les extensions que ens interesen i estan pujades correctament
COPY extensions/ ./extensions/


#Apliquem un canvi per a canviar un titol a una llibreria
RUN \
sed -i 's/{provider:t.name}/{provider:"compte UdL"}/g' node_modules/@directus/app/dist/index.b9fa10b5.js

