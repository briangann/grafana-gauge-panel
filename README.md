# Grafana Gauge Panel

[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-gauge-panel%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-gauge-panel)
[![License](https://img.shields.io/github/license/briangann/grafana-gauge-panel)](LICENSE)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-gauge-panel/workflows/Release/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/maintainability)](https://codeclimate.com/github/briangann/grafana-gauge-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1c750faa58c1f7b3c7fa/test_coverage)](https://codeclimate.com/github/briangann/grafana-gauge-panel/test_coverage)

[![All Contributors](https://img.shields.io/github/all-contributors/briangann/grafana-gauge-panel?color=ee8449&style=flat-square)](#contributors)

This panel plugin provides a [D3-based](https://d3js.org) gauge panel
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

| Option    | Description |
|-----------|-------------|
| Stat      | The statistic to be displayed on the gauge |
| Unit      | A unit for the value displayed. This will be used to abbreviate as needed |
| Decimals  | Maximum number of decimals to display if any are required

#### Font Settings

![Font Settings](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-font-settings.png)

| Option              | Description |
|---------------------|-------------|
|Value Font           | Font to be used on the value displayed      |
|Value Font Size      | Font Size for the value displayed           |
|Tick Label Font      | Font to be used on the tick labels          |
|Tick Label Font Size | Font size to be used on for the tick labels |

#### Needle Options

![Needle Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-needle-options.png)

| Option                     | Description |
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

| Option                     | Description |
|----------------------------|-------------|
| Minimum Value              | Minimum Value allowed on the face |
| Maximum Value              | Maximum Value allowed on the face |

#### Coloring

![Coloring](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-coloring.png)

| Option        | Description |
|---------------|-------------|
|Outer Edge     | Color of the outer edge of the gauge |
|Inner (Face)   | Color used on the face of the gauge (background of dial) |
|Pivot          | Color of the pivot (center) |
|Needle         | Color of the needle |
|Units Label    | Color for label units when displayed |
|Tick Label     | Color of values displayed near the tick major sections |
|Tick Major     | Color of the major ticks (longer lines) |
|Tick Minor     | Color of the minitor ticks (shorter lines) |

#### Radial Customization

Note that many of these settings are very sensitive to the visualization since they are percentages of the radius.
Adjust in small increments to see how they affect the gauge.

![Radial Customization](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-radial-customization.png)

| Option               | Description |
|----------------------|-------------|
| Radius               | Specifies size of gauge by radius. Value 0 (zero) will auto-scale to fit panel |
| Tickness Gauge Basis | Scaling for tick, a lower value will autoscale poorly |
| Pivot Radius         | Size of the center pivot, as a percentage of radius |
| Value Y-Offset       | Sets a vertical offset to better place the displayed metric |
| Padding              | Adds space between the ticks and outer edge |
| Edge Width           | Thickness of the circle around the edge of the gauge, as a percentage of the gauge radius |
| Tick Edge Gap        | Spacing between ticks and the outer circle, as a percentage of the gauge radius |
| Tick Length Major    | Length of the major ticks, as a percentage of the gauge radius |
| Tick Width Major     | Width of the major ticks in pixels |
| Tick Length Minor    | Length of the minor ticks, as a percentage of the gauge radius |
| Tick Width Minor     | Width of the minor ticks in pixels |
| Needle Tick Gap      | Spacing between ticks the needle end, as a percentage of the gauge radius |
| Needle Length Stem   | Length of the needle section extending beyond the centre of the gauge, as a percentage of the gauge radius |

#### Gauge Degrees

This is the main section that is used to modify the displayed range on the gauge.

![Gauge Degrees](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-gauge-degrees.png)

| Option            | Description |
|-------------------|-------------|
| Zero Tick Angle   | Angle where the tick value (0) starts (default 60) |
| Max Tick Angle    | Angle where the tick value ends (default 300) |
| Zero Needle Angle | Angle where needle is at minimum value (default 40) |
| Max Needle Angle  | Angle where needle is at maximum value (default 320) |

#### Gauge Readings

![Gauge Readings](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-gauge-readings.png)

| Option             | Description |
|--------------------|-------------|
| Tick Spacing Major | The numeric spacing of the minor increment ticks |
| Tick Spacing Minor | The numeric spacing of the major increment ticks |

#### Tick Maps

![Tick Maps](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-tickmaps.png)

Use the `Add Tick Map` button to create a tick map.

A tick map allows you to substitute text for a given value.
Using this option a compass style gauge can be constructed.

| Option | Description |
|--------|-------------|
| Label  | Sets the name of the Tick Map |
| Value  | Tick value where the text will be placed |
| Text   | Text to be displayed |

### Thresholds

Thresholds operate in the same manner as other Grafana plugins.

There are additional display options detailed below.

![Thresholds](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-config-thresholds.png)

| Option                             | Description |
|------------------------------------|-------------|
| Show Threshold Band On Gauge       | Thresholds are displayed as a band on face of gauge along the needle arc |
| Show Lower Range                   | Lower threshold is displayed on band |
| Show Middle Range                  | Middle thresholds are displayed on band |
| Show Upper Range                   | Upper threshold is displayed on band |
| Show Threshold State on Background | Gauge face color changes to state of threshold |
| Show Threshold State on Value      | Displayed value color changes to state of threshold |

When the middle and upper threshold option are selected, the gauge will look similar to this:

![Thresholds Middle Upper](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-settings-middle-upper.png)

The state of the threshold can be displayed as the background color of the gauge.

![Threshold on Face](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-on-face.png)

The state of the threshold can be displayed on the value of the gauge.

![Threshold on Value](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/main/src/screenshots/react-gauge-threshold-on-value.png)

### Value Mappings

Value Mappings works the same as other Grafana plugins.  This allows displaying alternative text instead of the value based on ranges or regular expressions.

Primarily this is used for `N/A` for `null` data, but can be used to indicate a state.

Ex: For a temperature gauge, a value below 0 could be harmful, or a value above 100 could be harmful to a device. A value mapping could be used to display this as an urgent message, or simply indicate a "nominal" reading.

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
See the [CONTRIBUTING.md](https://github.com/briangann/grafana-gauge-panel/blob/main/CONTRIBUTING.md) doc for more information.

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
