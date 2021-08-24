ARG DIRECTUS_VERSION=9.0.0-rc.91

FROM directus/directus:${DIRECTUS_VERSION}

USER node
WORKDIR /directus

#Suposem que previament ja hem compilat les extensions que ens interesen i estan pujades correctament
COPY extensions/ ./extensions/
