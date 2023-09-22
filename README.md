# Grafana Gauge Panel

[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![License](https://img.shields.io/github/license/briangann/grafana-gauge-panel)](LICENSE)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-gauge-panel/workflows/Release/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/maintainability)](https://codeclimate.com/github/briangann/grafana-gauge-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/test_coverage)](https://codeclimate.com/github/briangann/grafana-gauge-panel/test_coverage)

This panel plugin provides a [D3-based](https://www.d3js.org) gauge panel
for [Grafana](https://www.grafana.com) 8.4.10+/9.x/10.x

## Screenshots

### Example gauges

![Default Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-default-settings.png)
![Default Gauge With Threshold](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/default-gauge-w-threshold.png)

![Custom Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/alt-gauge.png)
![Custom Gauge With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/alt-gauge-limits.png)

### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/options.png)

With Limits

![Options with Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/options-limits.png)

### Limits Shown

![Options With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/options-limits.png)

### Radial Metrics

![Radial Metrics](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/radialmetrics.png)

### Thresholding

![Thresholding](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/thresholding.png)

-------

## Features

* Data operator same as SingleStat panel (avg, sum, current, etc)
* Unit formats same as SingleStat

* Customizable Font size and type for value displayed and ticks
* Animated needle transition (elastic or quadin)
* Adjustable Limits
* All possible color options for gauge components

* Customizable gauge component sizes (needle length, width, tick length, etc)

* Threshold colors displayed on gauge
* Threshold can modify displayed value and background

* Needle animation speed is now configurable
* Arbitrary degree gauges now supported (default is from 60 to 320)
* Value text on gauge can now be moved up/down as needed

## Contributing

All contributions are welcome!
See the [CONTRIBUTING.md](CONTRIBUTING.md) doc for more information.

## Acknowledgements

This panel is based on the "SingleStat" panel by Grafana, along with large portions of these excellent D3 examples:

* <https://oliverbinns.com/articles/D3js-gauge/>
* <http://bl.ocks.org/tomerd/1499279>
* <http://bl.ocks.org/dustinlarimer/5888271> Markers!
