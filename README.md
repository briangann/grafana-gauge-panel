# Grafana Gauge Panel

[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![License](https://img.shields.io/github/license/briangann/grafana-gauge-panel)](LICENSE)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-gauge-panel/workflows/Release/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/briangann/grafana-gauge-panel/badge.svg)](https://snyk.io/test/github/briangann/grafana-gauge-panel)
[![Maintainability](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/maintainability)](https://codeclimate.com/github/briangann/grafana-gauge-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/test_coverage)](https://codeclimate.com/github/briangann/grafana-gauge-panel/test_coverage)

This panel plugin provides a [D3-based](https://www.d3js.org) gauge panel for [Grafana](https://www.grafana.com) 6.x/7.x

## Screenshots

### Example gauges

![Default Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/default-gauge.png)
![Default Gauge With Threshold](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/default-gauge-w-threshold.png)

![Custom Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/alt-gauge.png)
![Custom Gauge With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/alt-gauge-limits.png)

### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options.png)

With Limits

![Options with Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options-limits.png)

### Limits Shown

![Options With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options-limits.png)

### Radial Metrics

![Radial Metrics](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/radialmetrics.png)

### Thresholding

![Thresholding](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/thresholding.png)

-------

## Features

* Data operator same as SingleStat panel (avg, sum, current, etc)
* Unit formats same as SingleStat

* Customizable Font size and type for value displayed and ticks
* Animated needle transition (elastic or quadin)
* Adjustable Limits
* All possible color options for gauge components

* Customizable gauge component sizes (needle length, width, tick length, etc)

* Thresholding colors displayed on gauge
* Threshold can modify displayed value and background

* Needle animation speed is now configurable
* Arbitrary degree gauges now supported (default is from 60 to 320)
* Value text on gauge can now be moved up/down as needed

## Building

This plugin relies on Grunt/NPM/Bower, typical build sequence:

```BASH
yarn install
yarn build
```

For development, you can run:

```BASH
yarn watch
```

## Docker Support

A docker-compose.yml file is include for easy development and testing, just run

```BASH
docker-compose up
```

Then browse to <http://localhost:3000>

## External Dependencies

* Grafana 6.x

## Build Dependencies

* yarn

## Acknowledgements

This panel is based on the "SingleStat" panel by Grafana, along with large portions of these excellent D3 examples:

* <https://oliverbinns.com/articles/D3js-gauge/>
* <http://bl.ocks.org/tomerd/1499279>
* <http://bl.ocks.org/dustinlarimer/5888271> Markers!
