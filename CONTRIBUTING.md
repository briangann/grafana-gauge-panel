# Contribution Guide

## Building the plugin

This plugin relies on YARN v3 and Node 18. The typical build sequence is:

```BASH
yarn install
yarn build
```

For development, you can run:

```BASH
yarn dev
```

## Docker Support

A docker-compose.yml file is include for easy development and testing, just run

```BASH
docker-compose up
```

Then browse to <http://localhost:3000>

There is also a catalog-review directory with a more complete setup that includes a datasource and sample dashboards.

## External Dependencies

* Grafana 8.4.10+

## Build Dependencies

* yarn v3
* node 18
