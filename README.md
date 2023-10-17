# Grafana Gauge Panel

[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![License](https://img.shields.io/github/license/briangann/grafana-gauge-panel)](LICENSE)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-gauge-panel/workflows/Release/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/maintainability)](https://codeclimate.com/github/briangann/grafana-gauge-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/test_coverage)](https://codeclimate.com/github/briangann/grafana-gauge-panel/test_coverage)

[![All Contributors](https://img.shields.io/github/all-contributors/briangann/grafana-gauge-panel?color=ee8449&style=flat-square)](#contributors)

This panel plugin provides a [D3-based](https://www.d3js.org) gauge panel
for [Grafana](https://www.grafana.com) 8.4.10+/9.x/10.x

## Screenshots

### Example gauges

![Default Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-default-settings.png)

![Default Gauge With Threshold](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-middle-upper.png)

![Default Gauge With All Thresholds](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-threshold-all.png)

![Custom Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/alt-gauge.png)

![Custom Gauge With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/alt-gauge-limits.png)

### Configuration Options

The React port has separated the configuration options into multiple searchable sections and added new features.

#### Standard Options

![Standard Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-standard-options.png)

|Option     | Description |
|-----------|-------------|
| Stat      | The statistic to be displayed on the gauge |
| Unit      | A unit for the value displayed. This will be used to abbreviate as needed |
| Decimals  | Maximum number of decimals to display if any are required

#### Font Settings

![Font Settings](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-font-settings.png)

|Option               | Description |
|---------------------|-------------|
|Value Font           | Font to be used on the value displayed      |
|Value Font Size      | Font Size for the value displayed           |
|Tick Label Font      | Font to be used on the tick labels          |
|Tick Label Font Size | Font size to be used on for the tick labels |

#### Needle Options

![Needle Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-needle-options.png)

|Option                      | Description |
|----------------------------|-------------|
| Animate Needle Transition  | Enables needle animation between values                                     |
| Transition Speed (MS)      | When animation is enabled, set how fast the transition occurs               |
| Allow Crossing Limits      | Enable this to allow the needle to go below and above the limit             |
| Needle Cross Limit Degrees | When crossing limits is enabled, this sets the degrees that can be exceeded |
| Needle Width               | Specifies the width of the needle                                           |
| Show End Marker            | This will create a marker at the end of the needle of the specified shape   |
| Show Start Marker          | This will create a marker at the start of the needle of the specified shape |

When the options `Allow Crossing Limits` is enabled, the needle can exceed
the maximum or minimum limit by the specified degrees. The example below shows a gauge with a limit of 100,
and allows the needle to cross the limit (burying the needle).

![Needle Cross Enabled](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-needle-cross-enabled.png)

#### Limits

![Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-limits.png)

Minimum Value
Maximum Value

#### Coloring

![Coloring](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-coloring.png)

Outer Edge
Inner (Face)
Pivot
Needle
Units Label
Tick Label
Tick Major
Tick Minor

#### Radial Customization

![Radial Customization](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-radial-customization.png)

Radius
Tickness Gauge Basis
Pivot Radius
Value Y-Offset
Padding
Edge Width
Tick Edge Gap
Tick Length Major
Tick Width Major
Tick Length Minor
Tick Width Minor
Needle Tick Gap
Needle Length Stem

#### Gauge Degrees

![Gauge Degrees](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-gauge-degrees.png)

Zero Tick Angle
Max Tick Angle
Zero Needle Angle
Max Needle Angle

#### Gauge Readings

![Gauge Readings](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-gauge-readings.png)

Tick Spacing Major
Tick Spacing Minor

#### Tick Maps

![Tick Maps](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-tickmaps.png)

Use the `Add Tick Map` button to create a tick map.

### Thresholds

![Thresholds](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-thresholds.png)

![Thresholds Middle Upper](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-settings-middle-upper.png)

![Threshold on Face](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-on-face.png)

![Threshold on Value](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-on-value.png)

### Value Mappings

![Value Mappings](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-value-mappings.png)

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

* Needle animation speed is configurable
* Arbitrary degree gauges now supported (default is from 60 to 320)
* Value text on gauge can now be moved up/down as needed

## Contributing

All contributions are welcome!
See the [CONTRIBUTING.md](CONTRIBUTING.md) doc for more information.

## Acknowledgements

This panel is based on the "SingleStat" panel by Grafana, along with large
 portions of these excellent D3 examples:

* <https://oliverbinns.com/articles/D3js-gauge/>
* <http://bl.ocks.org/tomerd/1499279>
* <http://bl.ocks.org/dustinlarimer/5888271> Markers!

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
