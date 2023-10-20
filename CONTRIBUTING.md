# Contribution Guide

## Building the plugin

This plugin relies on `pnpm` and Node 18. The typical build sequence is:

```BASH
pnpm install
pnpm build
```

For development, you can run:

```BASH
pnpm dev
```

## Docker Support

A docker-compose.yml file is include for easy development and testing, just run

```BASH
docker-compose up
```

Then browse to <http://localhost:3000>

There is also a catalog-review directory with a more complete setup that includes
a datasource and sample dashboards.

## External Dependencies

* Grafana 9.3.16+

## Build Dependencies

* pnpm
* node 18
