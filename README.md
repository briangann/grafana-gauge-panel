# Grafana Gauge Panel

This panel plugin provides a [D3-based](http://www.d3js.org) gauge panel for [Grafana](http://www.grafana.org) 3.x

### Screenshots

##### Example gauges

![Default Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/default-gauge.png)
![Default Gauge With Threshold](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/default-gauge-w-threshold.png)

![Custom Gauge](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/alt-gauge.png)
![Custom Gauge With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/alt-gauge-limits.png)

##### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options.png)

With Limits

![Options with Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options-limits.png)

##### Limits Shown

![Options With Limits](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/options-limits.png)

##### Radial Metrics
![Radial Metrics](https://raw.githubusercontent.com/briangann/grafana-gauge-panel/master/src/screenshots/radialmetrics.png)

##### Thresholding
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

```
npm install
bower install
grunt
```

For development, you can run:
```
grunt watch
```
The code will be parsed then copied into "dist" if "jslint" passes without errors.


### Docker Support

A docker-compose.yml file is include for easy development and testing, just run
```
docker-compose up
```

Then browse to http://localhost:3000


## External Dependencies

* Grafana 3.x

## Build Dependencies

* npm
* bower
* grunt

#### Acknowledgements

This panel is based on the "SingleStat" panel by Grafana, along with large portions of these excellent D3 examples:
* https://oliverbinns.com/articles/D3js-gauge/
* http://bl.ocks.org/tomerd/1499279

#### Changelog


##### v0.0.1
- Initial commit
