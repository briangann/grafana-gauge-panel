import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
//import * as d3 from '../bower_components/d3/d3.js';
import * as d3 from './external/d3.v3.min';
import './css/panel.css!';
import './external/d3gauge';

const panelDefaults = {
  fontSizes: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70],
  fontTypes: [
    'Arial', 'Avant Garde', 'Bookman',
    'Consolas', 'Courier', 'Courier New',
    'Garamond', 'Helvetica', 'Open Sans',
    'Palatino', 'Times', 'Times New Roman',
    'Verdana'
  ],
  unitFormats: kbn.getUnitFormats(),
  operatorNameOptions: ['min','max','avg', 'current', 'total', 'name'],
  valueMaps: [
    { value: 'null', op: '=', text: 'N/A' }
  ],
  mappingTypes: [
    {name: 'value to text', value: 1},
    {name: 'range to text', value: 2},
  ],
  rangeMaps: [
    { from: 'null', to: 'null', text: 'N/A' }
  ],
  mappingType: 1,
  thresholds: '',
  colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
  decimals: 2, // decimal precision
  format: 'none', // unit format
  operatorName: 'avg', // operator applied to time series
  gauge: {
    minValue: 0,
    maxValue: 100,
    tickSpaceMinVal: 1,
    tickSpaceMajVal: 10,
    gaugeUnits: '', // no units by default, this will be selected by user
    gaugeRadius: 0, // 0 for auto-scale
    pivotRadius: 0.1,
    padding: 0.05,
    edgeWidth: 0.05,
    tickEdgeGap: 0.05,
    tickLengthMaj: 0.15,
    tickLengthMin: 0.05,
    needleTickGap: 0.05,
    needleLengthNeg: 0.2,
    ticknessGaugeBasis: 200,
    needleWidth: 5,
    tickWidthMaj: 5,
    tickWidthMin: 1,
    unitsLabelFontSize: 22,
    labelFontSize: 18,
    zeroTickAngle: 60,
    maxTickAngle: 300,
    zeroNeedleAngle: 40,
    maxNeedleAngle: 320,
    outerEdgeCol:  '#0099CC',
    innerCol:      '#fff',
    pivotCol:      '#999',
    needleCol:     '#0099CC',
    unitsLabelCol: '#000',
    tickLabelCol:  '#000',
    tickColMaj:    '#0099CC',
    tickColMin:    '#000',
    tickFont: 'Open Sans',
    unitsFont: 'Open Sans',
    showThresholdOnGauge: false,
    showThresholdColorOnValue: false,
    showLowerThresholdRange: false,
    showMiddleThresholdRange: true,
    showUpperThresholdRange: true,
    animateNeedleValueTransition: true,
  },
};

class D3GaugePanelCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, alertSrv) {
    super($scope, $injector);
    // merge existing settings with our defaults
    _.defaults(this.panel, panelDefaults);
    this.panel.gaugeDivId = 'd3gauge_svg_' + this.panel.id;
    this.scoperef = $scope;
    this.alertSrvRef = alertSrv;
    this.initialized = false;
    this.panelContainer = null;
    this.svg = null;
    this.panelWidth = null;
    this.panelHeight = null;
    this.gaugeObject = null;
    this.data = {
      value: 0,
      valueFormatted: 0,
      valueRounded: 0
    };
    this.series = [];
    //console.log("D3GaugePanelCtrl constructor!");
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    //console.log("D3GaugePanelCtrl constructor done!");
  }

  onInitEditMode() {
    // determine the path to this plugin
    var panels = grafanaBootData.settings.panels;
    var thisPanel = panels[this.pluginId];
    var thisPanelPath = thisPanel.baseUrl + '/';
    // add the relative path to the partial
    var optionsPath = thisPanelPath + 'partials/editor.options.html';
    this.addEditorTab('Options', optionsPath, 2);
    var radialMetricsPath = thisPanelPath + 'partials/editor.radialmetrics.html';
    this.addEditorTab('Radial Metrics', radialMetricsPath, 3);
    var thresholdingPath = thisPanelPath + 'partials/editor.thresholding.html';
    this.addEditorTab('Thresholding', thresholdingPath, 4);
    var mappingsPath = thisPanelPath + 'partials/editor.mappings.html';
    this.addEditorTab('Value Mappings', mappingsPath, 5);
  }

  /**
   * [setContainer description]
   * @param {[type]} container [description]
   */
  setContainer(container) {
    this.panelContainer = container;
  }

  getPanelWidth() {
    // with a full sized panel, this comes back as zero, so calculate from the div panel instead
    //debugger;
    var tmpPanelWidth = this.panelContainer[0].clientWidth;
    if (tmpPanelWidth === 0) {
      // just use the height...
      tmpPanelWidth = this.getPanelHeight();
      tmpPanelWidth -= 24;
      if (tmpPanelWidth < 250) {
        tmpPanelWidth = 250;
      }
      return tmpPanelWidth;
      //var tmpPanelWidthCSS = $("div.panel").css("width");
      //var tmpPanelWidthPx = tmpPanelWidthCSS.replace("px","");
      //tmpPanelWidth = parseInt(tmpPanelWidthPx);
    }
    var actualWidth = tmpPanelWidth;
    return actualWidth;
  }

  getPanelHeight() {
    // panel can have a fixed height via options
    var tmpPanelHeight = this.$scope.ctrl.panel.height;
    // if that is blank, try to get it from our row
    if (typeof tmpPanelHeight === 'undefined') {
      // get from the row instead
      tmpPanelHeight = this.row.height;
      // default to 250px if that was undefined also
      if (typeof tmpPanelHeight === 'undefined') {
        tmpPanelHeight = 250;
      }
    }
    else {
      // convert to numeric value
      tmpPanelHeight = tmpPanelHeight.replace("px","");
    }
    var actualHeight = parseInt(tmpPanelHeight);
    // grafana minimum height for a panel is 250px
    if (actualHeight < 250) {
      actualHeight = 250;
    }
    return actualHeight;
  }

  clearSVG() {
    if ($('#'+this.panel.gaugeDivId).length) {
      //console.log("Clearing SVG");
      $('#'+this.panel.gaugeDivId).remove();
    }
  }
  onRender() {
    // update the values to be sent to the gauge constructor
    this.setValues(this.data);
    //console.log("Render D3");
    this.clearSVG();
    // use jQuery to get the height on our container
    this.panelWidth = this.getPanelWidth();
    this.panelHeight = this.getPanelHeight();

    var margin = {top: 10, right: 0, bottom: 30, left: 0};
    var width = this.panelWidth;
    var height = this.panelHeight;
    //console.log("width: " + width + " height: " + height);
    var svg = d3.select(this.panelContainer[0])
      .append("svg")
      .attr("width", width + "px")
      .attr("height", (height + 24) + "px")
      .attr("id", this.panel.gaugeDivId)
      .classed("svg-content-responsive", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // check which is smaller, the height or the width and set the radius to be half of the lesser
    var tmpGaugeRadius = parseFloat(this.panel.gauge.gaugeRadius);
    // autosize if radius is set to zero
    if (this.panel.gauge.gaugeRadius === 0) {
      tmpGaugeRadius = this.panelHeight / 2;
      if (this.panelWidth < this.panelHeight) {
        tmpGaugeRadius = this.panelWidth / 2;
      }
      tmpGaugeRadius -= 10;
    }
    var opt = {
      minVal : this.panel.gauge.minValue,
      maxVal : this.panel.gauge.maxValue,
      tickSpaceMinVal: this.panel.gauge.tickSpaceMinVal,
      tickSpaceMajVal: this.panel.gauge.tickSpaceMajVal,
      gaugeUnits: this.panel.format,
      gaugeRadius: tmpGaugeRadius,
      pivotRadius: this.panel.gauge.pivotRadius,
      padding: this.panel.gauge.padding,
      edgeWidth: this.panel.gauge.edgeWidth,
      tickEdgeGap: this.panel.gauge.tickEdgeGap,
      tickLengthMaj: this.panel.gauge.tickLengthMaj,
      tickLengthMin: this.panel.gauge.tickLengthMin,
      needleTickGap: this.panel.gauge.needleTickGap,
      needleLengthNeg: this.panel.gauge.needleLengthNeg,
      ticknessGaugeBasis: this.panel.gauge.ticknessGaugeBasis,
      needleWidth: this.panel.gauge.needleWidth,
      tickWidthMaj: this.panel.gauge.tickWidthMaj,
      tickWidthMin: this.panel.gauge.tickWidthMin,
      unitsLabelFontSize: this.panel.gauge.unitsLabelFontSize,
      labelFontSize: this.panel.gauge.labelFontSize,
      zeroTickAngle: this.panel.gauge.zeroTickAngle,
      maxTickAngle: this.panel.gauge.maxTickAngle,
      zeroNeedleAngle: this.panel.gauge.zeroNeedleAngle,
      maxNeedleAngle: this.panel.gauge.maxNeedleAngle,
      outerEdgeCol:  this.panel.gauge.outerEdgeCol,
      innerCol:      this.panel.gauge.innerCol,
      pivotCol:      this.panel.gauge.pivotCol,
      needleCol:     this.panel.gauge.needleCol,
      unitsLabelCol: this.panel.gauge.unitsLabelCol,
      tickLabelCol:  this.panel.gauge.tickLabelCol,
      tickColMaj:    this.panel.gauge.tickColMaj,
      tickColMin:    this.panel.gauge.tickColMin,
      thresholds:    this.panel.thresholds,
      showThresholdColorOnValue: this.panel.gauge.showThresholdColorOnValue,
      showThresholdOnGauge: this.panel.gauge.showThresholdOnGauge,
      showLowerThresholdRange: this.panel.gauge.showLowerThresholdRange,
      showMiddleThresholdRange: this.panel.gauge.showMiddleThresholdRange,
      showUpperThresholdRange: this.panel.gauge.showUpperThresholdRange,
      thresholdColors: this.panel.colors,
      needleValText : this.getValueText(),
      needleVal : this.getValueRounded(),
      tickFont: this.panel.gauge.tickFont,
      unitsFont: this.panel.gauge.unitsFont,
      animateNeedleValueTransition: this.panel.gauge.animateNeedleValueTransition
    };
    this.gaugeObject = new drawGauge(svg,opt);
    this.svg = svg;
  }

  removeValueMap(map) {
    var index = _.indexOf(this.panel.valueMaps, map);
    this.panel.valueMaps.splice(index, 1);
    this.render();
  }

  addValueMap() {
    this.panel.valueMaps.push({value: '', op: '=', text: '' });
  }

  removeRangeMap(rangeMap) {
    var index = _.indexOf(this.panel.rangeMaps, rangeMap);
    this.panel.rangeMaps.splice(index, 1);
    this.render();
  }

  addRangeMap() {
    this.panel.rangeMaps.push({from: '', to: '', text: ''});
  }

  validateRadialMetricValues() {
    // make sure the spacing values are valid
    if ((this.panel.gauge.tickSpaceMinVal === null) ||
        (this.panel.gauge.tickSpaceMinVal === "") ||
        (isNaN(this.panel.gauge.tickSpaceMinVal))
      ){
      // alert about the error, and set it to 1
      this.panel.gauge.tickSpaceMinVal = 1;
      this.alertSrvRef.set("Problem!", "Invalid Value for Tick Spacing Minor, auto-setting back to default of 1", 'error', 10000);
    }
    if ((this.panel.gauge.tickSpaceMajVal === null) ||
        (this.panel.gauge.tickSpaceMajVal === "") ||
        (isNaN(this.panel.gauge.tickSpaceMajVal))
      ){
      // alert about the error, and set it to 10
      this.panel.gauge.tickSpaceMajVal = 10;
      this.alertSrvRef.set("Problem!", "Invalid Value for Tick Spacing Major, auto-setting back to default of 10", 'error', 10000);
    }
    if ((this.panel.gauge.gaugeRadius === null) ||
        (this.panel.gauge.gaugeRadius === "") ||
        (isNaN(this.panel.gauge.gaugeRadius) ||
        (this.panel.gauge.gaugeRadius < 0))
      ){
      // alert about the error, and set it to 0
      this.panel.gauge.gaugeRadius = 0;
      this.alertSrvRef.set("Problem!", "Invalid Value for Gauge Radius, auto-setting back to default of 0", 'error', 10000);
    }
    this.render();
  }

  link(scope, elem, attrs, ctrl) {
    //console.log("d3gauge inside link");
    ctrl.setContainer(elem.find('.grafana-d3-gauge'));
    // Check if there is a gauge rendered
    var renderedSVG = $('#'+this.panel.gaugeDivId);
    // console.log("link: found svg length " + renderedSVG.length);
    if (renderedSVG.length === 0) {
      // no gauge found, force a render
      this.render();
    }
  }


  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return {decimals: this.panel.decimals, scaledDecimals: null};
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec),
        norm = delta / magn, // norm is between 1.0 and 10.0
        size;

    if (norm < 1.5) {
      size = 1;
    } else if (norm < 3) {
      size = 2;
      // special case for 2.5, requires an extra decimal
      if (norm > 2.25) {
        size = 2.5;
        ++dec;
      }
    } else if (norm < 7.5) {
      size = 5;
    } else {
      size = 10;
    }

    size *= magn;

    // reduce starting decimals if not needed
    if (Math.floor(value) === value) { dec = 0; }

    var result = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;
    return result;
  }

  setValues(data) {
    data.flotpairs = [];
    if (this.series.length > 1) {
      var error = new Error();
      error.message = 'Multiple Series Error';
      error.data = 'Metric query returns ' + this.series.length +
        ' series. Single Stat Panel expects a single series.\n\nResponse:\n'+JSON.stringify(this.series);
      throw error;
    }

    if (this.series && this.series.length > 0) {
      var lastPoint = _.last(this.series[0].datapoints);
      var lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

      if (this.panel.operatorName === 'name') {
        data.value = 0;
        data.valueRounded = 0;
        data.valueFormatted = this.series[0].alias;
      } else if (_.isString(lastValue)) {
        data.value = 0;
        data.valueFormatted = _.escape(lastValue);
        data.valueRounded = 0;
      } else {
        data.value = this.series[0].stats[this.panel.operatorName];
        data.flotpairs = this.series[0].flotpairs;
        var decimalInfo = this.getDecimalsForValue(data.value);
        var formatFunc = kbn.valueFormats[this.panel.format];
        data.valueFormatted = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
      }

      // Add $__name variable for using in prefix or postfix
      data.scopedVars = {
        __name: {
          value: this.series[0].label
        }
      };
    }

    // check value to text mappings if its enabled
    if (this.panel.mappingType === 1) {
      for (var i = 0; i < this.panel.valueMaps.length; i++) {
        var map = this.panel.valueMaps[i];
        // special null case
        if (map.value === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to text mapping
        var value = parseFloat(map.value);
        if (value === data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    } else if (this.panel.mappingType === 2) {
      for (var j = 0; j < this.panel.rangeMaps.length; j++) {
        var rangeMap = this.panel.rangeMaps[j];
        // special null case
        if (rangeMap.from === 'null' && rangeMap.to === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = rangeMap.text;
            return;
          }
          continue;
        }

        // value/number to range mapping
        var from = parseFloat(rangeMap.from);
        var to = parseFloat(rangeMap.to);
        if (to >= data.valueRounded && from <= data.valueRounded) {
          data.valueFormatted = rangeMap.text;
          return;
        }
      }
    }

    if (data.value === null || data.value === void 0) {
      data.valueFormatted = "no value";
    }
  }

  getValueText() {
    return this.data.valueFormatted;
  }

  getValueRounded() {
    return this.data.valueRounded;
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError(err) {
    this.onDataReceived([]);
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    var data = {};
    this.setValues(data);
    this.data = data;
    //console.log("Data value: " + data.value + " formatted: " + data.valueFormatted + " rounded: " + data.valueRounded );
    //var fmtTxt = kbn.valueFormats[this.panel.format];
    //console.log("Format: " + fmtTxt);
    this.gaugeObject.updateGauge(data.value, data.valueFormatted, data.valueRounded);
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  invertColorOrder() {
    var tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }
}

function getColorForValue(data, value) {
  for (var i = data.thresholds.length; i > 0; i--) {
    if (value >= data.thresholds[i-1]) {
      return data.colorMap[i];
    }
  }
  return _.first(data.colorMap);
}

D3GaugePanelCtrl.templateUrl = 'partials/template.html';
export {
	D3GaugePanelCtrl,
	D3GaugePanelCtrl as MetricsPanelCtrl
};
