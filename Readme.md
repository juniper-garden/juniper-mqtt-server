## DEV
docker build . -t=juniper-mqtt

## Prod
replace v1.0.8 with the version you want to build

yarn build
docker build . -t=registry.digitalocean.com/juniper-mqtt/juniper-mqtt:v1.0.8
docker push registry.digitalocean.com/juniper-mqtt/juniper-mqtt:v1.0.8