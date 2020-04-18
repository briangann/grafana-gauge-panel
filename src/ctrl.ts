import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import _ from 'lodash';
import $ from 'jquery';
import kbn from 'grafana/app/core/utils/kbn';
import TimeSeries from 'grafana/app/core/time_series2';
import * as d3 from 'd3';

// @ts-ignore
import { DrawGauge } from './libs/d3gauge';

const panelDefaults = {
  fontSizes: [
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    22,
    24,
    26,
    28,
    30,
    32,
    34,
    36,
    38,
    40,
    42,
    44,
    46,
    48,
    50,
    52,
    54,
    56,
    58,
    60,
    62,
    64,
    66,
    68,
    70,
  ],
  fontTypes: [
    'Arial',
    'Avant Garde',
    'Bookman',
    'Consolas',
    'Courier',
    'Courier New',
    'Garamond',
    'Helvetica',
    'Open Sans',
    'Palatino',
    'Times',
    'Times New Roman',
    'Verdana',
  ],
  unitFormats: kbn.getUnitFormats(),
  operatorNameOptions: ['min', 'max', 'avg', 'current', 'total', 'name'],
  valueMaps: [{ value: 'null', op: '=', text: 'N/A' }],
  mappingTypes: [
    { name: 'value to text', value: 1 },
    { name: 'range to text', value: 2 },
  ],
  rangeMaps: [{ from: 'null', to: 'null', text: 'N/A' }],
  tickMaps: [],
  mappingType: 1,
  thresholds: '',
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
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
    outerEdgeCol: '#0099CC',
    innerCol: '#fff',
    pivotCol: '#999',
    needleCol: '#0099CC',
    unitsLabelCol: '#000',
    tickLabelCol: '#000',
    tickColMaj: '#0099CC',
    tickColMin: '#000',
    tickFont: 'Open Sans',
    unitsFont: 'Open Sans',
    valueYOffset: 0,
    showThresholdOnGauge: false,
    showThresholdColorOnValue: false,
    showLowerThresholdRange: false,
    showMiddleThresholdRange: true,
    showUpperThresholdRange: true,
    animateNeedleValueTransition: true,
    animateNeedleValueTransitionSpeed: 100,
  },
};

export class D3GaugePanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/template.html';

  containerDivId: any;
  scoperef: any;
  alertSrvRef: any;
  initialized: boolean;
  panelContainer: any;
  svg: any;
  panelWidth: any;
  panelHeight: any;
  gaugeObject: any;
  data: any;
  series: any;

  /** @ngInject */
  constructor($scope: any, $injector: any, alertSrv: any) {
    super($scope, $injector);
    // merge existing settings with our defaults
    _.defaults(this.panel, panelDefaults);
    this.panel.gaugeDivId = 'd3gauge_svg_' + this.panel.id;
    this.containerDivId = 'container_' + this.panel.gaugeDivId;
    this.scoperef = $scope;
    this.alertSrvRef = alertSrv;
    this.initialized = false;
    this.panelContainer = null;
    this.panel.svgContainer = null;
    this.svg = null;
    this.panelWidth = null;
    this.panelHeight = null;
    this.gaugeObject = null;
    this.data = {
      value: 0,
      valueFormatted: 0,
      valueRounded: 0,
    };
    this.series = [];
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
  }

  onInitEditMode() {
    // determine the path to this plugin
    let thisPanelPath = 'public/plugins/' + this.panel.type + '/';
    // add the relative path to the partial
    let optionsPath = thisPanelPath + 'partials/editor.options.html';
    this.addEditorTab('Options', optionsPath, 2);
    let radialMetricsPath = thisPanelPath + 'partials/editor.radialmetrics.html';
    this.addEditorTab('Radial Metrics', radialMetricsPath, 3);
    let thresholdingPath = thisPanelPath + 'partials/editor.thresholding.html';
    this.addEditorTab('Thresholding', thresholdingPath, 4);
    let mappingsPath = thisPanelPath + 'partials/editor.mappings.html';
    this.addEditorTab('Value Mappings', mappingsPath, 5);
  }

  /**
   * [setContainer description]
   * @param {[type]} container [description]
   */
  setContainer(container: any) {
    this.panelContainer = container;
    this.panel.svgContainer = container;
  }

  // determine the width of a panel by the span and viewport
  getPanelWidthBySpan() {
    let trueWidth = 0;
    if (typeof this.panel.span === 'undefined') {
      // get the width based on the scaled container (v5 needs this)
      trueWidth = this.panelContainer.offsetParent.clientWidth;
    } else {
      // v4 and previous used fixed spans
      const viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      // get the pixels of a span
      let pixelsPerSpan = viewPortWidth / 12;
      // multiply num spans by pixelsPerSpan
      trueWidth = Math.round(this.panel.span * pixelsPerSpan);
    }
    return trueWidth;
  }

  getPanelHeight() {
    // panel can have a fixed height set via "General" tab in panel editor
    let tmpPanelHeight = this.panel.height;
    if (typeof tmpPanelHeight === 'undefined' || tmpPanelHeight === '') {
      // grafana also supplies the height, try to use that if the panel does not have a height
      tmpPanelHeight = String(this.height);
      // v4 and earlier define this height, detect span for pre-v5
      if (typeof this.panel.span !== 'undefined') {
        // if there is no header, adjust height to use all space available
        let panelTitleOffset = 20;
        if (this.panel.title !== '') {
          panelTitleOffset = 42;
        }
        tmpPanelHeight = String(this.containerHeight - panelTitleOffset); // offset for header
      }
      if (typeof tmpPanelHeight === 'undefined') {
        // height still cannot be determined, get it from the row instead
        tmpPanelHeight = this.row.height;
        if (typeof tmpPanelHeight === 'undefined') {
          // last resort - default to 250px (this should never happen)
          tmpPanelHeight = '250';
        }
      }
    }
    // replace px
    tmpPanelHeight = tmpPanelHeight.replace('px', '');
    // convert to numeric value
    let actualHeight = parseInt(tmpPanelHeight, 10);
    return actualHeight;
  }

  clearSVG() {
    if ($('#' + this.panel.gaugeDivId).length) {
      //console.log("Clearing SVG id: " + this.panel.gaugeDivId);
      $('#' + this.panel.gaugeDivId).remove();
    }
  }

  renderGauge() {
    // update the values to be sent to the gauge constructor
    this.setValues(this.data);
    if ($('#' + this.panel.gaugeDivId).length) {
      $('#' + this.panel.gaugeDivId).remove();
    }
    this.panelWidth = this.getPanelWidthBySpan();
    this.panelHeight = this.getPanelHeight();
    const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    // check which is smaller, the height or the width and set the radius to be half of the lesser
    let tmpGaugeRadius = parseFloat(this.panel.gauge.gaugeRadius);
    // autosize if radius is set to zero
    if (this.panel.gauge.gaugeRadius === 0) {
      tmpGaugeRadius = this.panelHeight / 2;
      if (this.panelWidth < this.panelHeight) {
        tmpGaugeRadius = this.panelWidth / 2;
        if (typeof this.panel.span !== 'undefined' && this.panel.title !== '') {
          // using the width requires more margin in pre-v5
          tmpGaugeRadius -= 5;
        }
      }
    }
    // calculate top margin
    let verticalOffset = Math.round(this.panelHeight - tmpGaugeRadius * 2) / 2;
    margin.top = verticalOffset;
    // pre-v5, with title, set top margin to at least 7px
    if (typeof this.panel.span !== 'undefined' && this.panel.title !== '') {
      if (verticalOffset < 7) {
        margin.top = 7;
      }
    }
    margin.bottom = verticalOffset;

    // set the width and height to be double the radius
    let svg = d3
      .select(this.panel.svgContainer)
      .append('svg')
      .style('margin-top', margin.top + 'px')
      .style('margin-bottom', margin.bottom + 'px')
      .style('margin-left', margin.left + 'px')
      .style('margin-right', margin.right + 'px')
      .attr('width', Math.round(tmpGaugeRadius * 2) + 'px')
      .attr('height', Math.round(tmpGaugeRadius * 2) + 'px')
      .attr('id', this.panel.gaugeDivId)
      .classed('svg-content-responsive', true)
      .append('g');

    let opt = {
      minVal: this.panel.gauge.minValue,
      maxVal: this.panel.gauge.maxValue,
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
      outerEdgeCol: this.panel.gauge.outerEdgeCol,
      innerCol: this.panel.gauge.innerCol,
      pivotCol: this.panel.gauge.pivotCol,
      needleCol: this.panel.gauge.needleCol,
      unitsLabelCol: this.panel.gauge.unitsLabelCol,
      tickLabelCol: this.panel.gauge.tickLabelCol,
      tickColMaj: this.panel.gauge.tickColMaj,
      tickColMin: this.panel.gauge.tickColMin,
      thresholds: this.panel.thresholds,
      showThresholdColorOnValue: this.panel.gauge.showThresholdColorOnValue,
      showThresholdOnGauge: this.panel.gauge.showThresholdOnGauge,
      showLowerThresholdRange: this.panel.gauge.showLowerThresholdRange,
      showMiddleThresholdRange: this.panel.gauge.showMiddleThresholdRange,
      showUpperThresholdRange: this.panel.gauge.showUpperThresholdRange,
      thresholdColors: this.panel.colors,
      needleValText: this.getValueText(),
      needleVal: this.getValueRounded(),
      tickFont: this.panel.gauge.tickFont,
      unitsFont: this.panel.gauge.unitsFont,
      valueYOffset: this.panel.gauge.valueYOffset,
      animateNeedleValueTransition: this.panel.gauge.animateNeedleValueTransition,
      animateNeedleValueTransitionSpeed: this.panel.gauge.animateNeedleValueTransitionSpeed,
      tickMaps: this.panel.tickMaps,
    };
    this.gaugeObject = new DrawGauge(svg, opt);
    this.svg = svg;
  }

  removeValueMap(map: any) {
    const index = _.indexOf(this.panel.valueMaps, map);
    this.panel.valueMaps.splice(index, 1);
    this.render();
  }

  addValueMap() {
    this.panel.valueMaps.push({ value: '', op: '=', text: '' });
  }

  removeRangeMap(rangeMap: any) {
    const index = _.indexOf(this.panel.rangeMaps, rangeMap);
    this.panel.rangeMaps.splice(index, 1);
    this.render();
  }

  addRangeMap() {
    this.panel.rangeMaps.push({ from: '', to: '', text: '' });
  }

  addTickMap() {
    this.panel.tickMaps.push({ value: 0, text: '' });
  }
  removeTickMap(tickMap: any) {
    const index = _.indexOf(this.panel.tickMaps, tickMap);
    this.panel.tickMaps.splice(index, 1);
    this.render();
  }

  /**
   * Ensure the min value is less than the max value, auto-adjust as needed
   * @return void
   */
  validateLimitsMinValue() {
    if (this.panel.gauge.minValue >= this.panel.gauge.maxValue) {
      // set the maxValue to be the same as the minValue+1
      this.panel.gauge.maxValue = this.panel.gauge.minValue + 1;
      this.alertSrvRef.set(
        'Problem!',
        'Minimum Value cannot be equal to or greater than Max Value, auto-adjusting Max Value to Minimum+1 (' + this.panel.gauge.maxValue + ')',
        'warning',
        10000
      );
    }
    this.render();
  }

  /**
   * Ensure the max value is greater than the min value, auto-adjust as needed
   * @return void
   */
  validateLimitsMaxValue() {
    if (this.panel.gauge.maxValue <= this.panel.gauge.minValue) {
      // set the minValue to be the same as the maxValue-1
      this.panel.gauge.minValue = this.panel.gauge.maxValue - 1;
      this.alertSrvRef.set(
        'Problem!',
        'Maximum Value cannot be equal to or less than Min Value, auto-adjusting Min Value to Maximum-1 (' + this.panel.gauge.minValue + ')',
        'warning',
        10000
      );
    }
    this.render();
  }

  validateTransitionValue() {
    if (this.panel.gauge.animateNeedleValueTransitionSpeed === null) {
      this.panel.gauge.animateNeedleValueTransitionSpeed = 100;
    }
    if (this.panel.gauge.animateNeedleValueTransitionSpeed < 0) {
      this.panel.gauge.animateNeedleValueTransitionSpeed = 0;
    }
    if (this.panel.gauge.animateNeedleValueTransitionSpeed > 60000) {
      this.panel.gauge.animateNeedleValueTransitionSpeed = 60000;
    }
    this.render();
  }

  // sanity check for tick degree settings
  validateGaugeTickDegreeValues() {
    if (
      this.panel.gauge.zeroTickAngle === null ||
      this.panel.gauge.zeroTickAngle === '' ||
      this.panel.gauge.zeroTickAngle < 0 ||
      isNaN(this.panel.gauge.zeroTickAngle)
    ) {
      // alert about the error, and set it to 60
      this.panel.gauge.zeroTickAngle = 60;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Zero Tick Angle, auto-setting to default of 60', 'error', 10000);
    }

    if (
      this.panel.gauge.maxTickAngle === null ||
      this.panel.gauge.maxTickAngle === '' ||
      this.panel.gauge.maxTickAngle < 0 ||
      isNaN(this.panel.gauge.maxTickAngle)
    ) {
      // alert about the error, and set it to 320
      this.panel.gauge.maxTickAngle = 320;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Max Tick Angle, auto-setting to default of 320', 'error', 10000);
    }

    let gaugeTickDegrees = this.panel.gauge.maxTickAngle - this.panel.gauge.zeroTickAngle;
    // make sure the total degrees does not exceed 360
    if (gaugeTickDegrees > 360) {
      // set to default values and alert
      this.panel.gauge.zeroTickAngle = 60;
      this.panel.gauge.maxTickAngle = 320;
      this.alertSrvRef.set('Problem!', 'Gauge tick angle difference is larger than 360 degrees, auto-setting to default values', 'error', 10000);
    }
    // make sure it is "positive"
    if (gaugeTickDegrees < 0) {
      // set to default values and alert
      this.panel.gauge.zeroTickAngle = 60;
      this.panel.gauge.maxTickAngle = 320;
      this.alertSrvRef.set('Problem!', 'Gauge tick angle difference is less than 0 degrees, auto-setting to default values', 'error', 10000);
    }

    // render
    this.render();
  }

  // sanity check for Needle degree settings
  validateGaugeNeedleDegreeValues() {
    if (
      this.panel.gauge.zeroNeedleAngle === null ||
      this.panel.gauge.zeroNeedleAngle === '' ||
      this.panel.gauge.zeroNeedleAngle < 0 ||
      isNaN(this.panel.gauge.zeroNeedleAngle)
    ) {
      // alert about the error, and set it to 60
      this.panel.gauge.zeroNeedleAngle = 60;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Zero Needle Angle, auto-setting to default of 60', 'error', 10000);
    }

    if (
      this.panel.gauge.maxNeedleAngle === null ||
      this.panel.gauge.maxNeedleAngle === '' ||
      this.panel.gauge.maxNeedleAngle < 0 ||
      isNaN(this.panel.gauge.maxNeedleAngle)
    ) {
      // alert about the error, and set it to 320
      this.panel.gauge.maxNeedleAngle = 320;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Max Needle Angle, auto-setting to default of 320', 'error', 10000);
    }

    let gaugeNeedleDegrees = this.panel.gauge.maxNeedleAngle - this.panel.gauge.zeroNeedleAngle;
    // make sure the total degrees does not exceed 360
    if (gaugeNeedleDegrees > 360) {
      // set to default values and alert
      this.panel.gauge.zeroNeedleAngle = 60;
      this.panel.gauge.maxNeedleAngle = 320;
      this.alertSrvRef.set('Problem!', 'Gauge needle angle difference is larger than 360 degrees, auto-setting to default values', 'error', 10000);
    }
    // make sure it is "positive"
    if (gaugeNeedleDegrees < 0) {
      // set to default values and alert
      this.panel.gauge.zeroNeedleAngle = 60;
      this.panel.gauge.maxNeedleAngle = 320;
      this.alertSrvRef.set('Problem!', 'Gauge needle angle difference is less than 0 degrees, auto-setting to default values', 'error', 10000);
    }

    // render
    this.render();
  }

  validateRadialMetricValues() {
    // make sure the spacing values are valid
    if (this.panel.gauge.tickSpaceMinVal === null || this.panel.gauge.tickSpaceMinVal === '' || isNaN(this.panel.gauge.tickSpaceMinVal)) {
      // alert about the error, and set it to 1
      this.panel.gauge.tickSpaceMinVal = 1;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Tick Spacing Minor, auto-setting back to default of 1', 'error', 10000);
    }
    if (this.panel.gauge.tickSpaceMajVal === null || this.panel.gauge.tickSpaceMajVal === '' || isNaN(this.panel.gauge.tickSpaceMajVal)) {
      // alert about the error, and set it to 10
      this.panel.gauge.tickSpaceMajVal = 10;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Tick Spacing Major, auto-setting back to default of 10', 'error', 10000);
    }
    if (
      this.panel.gauge.gaugeRadius === null ||
      this.panel.gauge.gaugeRadius === '' ||
      isNaN(this.panel.gauge.gaugeRadius) ||
      this.panel.gauge.gaugeRadius < 0
    ) {
      // alert about the error, and set it to 0
      this.panel.gauge.gaugeRadius = 0;
      this.alertSrvRef.set('Problem!', 'Invalid Value for Gauge Radius, auto-setting back to default of 0', 'error', 10000);
    }
    this.render();
  }

  link(scope: any, elem: any, attrs: any, ctrl: any) {
    let gaugeByClass = elem.find('.grafana-d3-gauge');
    gaugeByClass.append('<div id="' + ctrl.containerDivId + '"></div>');
    let container = gaugeByClass[0].childNodes[0];
    ctrl.setContainer(container);
    function render() {
      ctrl.renderGauge();
    }
    this.events.on('render', function() {
      render();
      ctrl.renderingCompleted();
    });
  }

  getDecimalsForValue(value: any) {
    if (_.isNumber(this.panel.decimals)) {
      return { decimals: this.panel.decimals, scaledDecimals: null };
    }

    const delta = value / 2;
    let dec = -Math.floor(Math.log(delta) / Math.LN10);

    let magn = Math.pow(10, -dec);
    let norm = delta / magn; // norm is between 1.0 and 10.0
    let size = 1;

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
    if (Math.floor(value) === value) {
      dec = 0;
    }

    let result = {
      decimals: 0,
      scaledDecimals: 0,
    };
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;
    return result;
  }

  setValues(data: any) {
    data.flotpairs = [];
    if (this.series.length > 1) {
      let error = new Error();
      error.message = 'Multiple Series Error';
      error.stack =
        'Metric query returns ' +
        this.series.length +
        ' series. Single Stat Panel expects a single series.\n\nResponse:\n' +
        JSON.stringify(this.series);
      throw error;
    }

    if (this.series && this.series.length > 0) {
      const lastPoint = _.last(this.series[0].datapoints);
      const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;

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
        let decimalInfo = this.getDecimalsForValue(data.value);
        let formatFunc = kbn.valueFormats[this.panel.format];
        data.valueFormatted = formatFunc(data.value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        data.valueRounded = kbn.roundValue(data.value, decimalInfo.decimals);
      }

      // Add $__name variable for using in prefix or postfix
      data.scopedVars = {
        __name: {
          value: this.series[0].label,
        },
      };
    }

    // check value to text mappings if its enabled
    if (this.panel.mappingType === 1) {
      for (let i = 0; i < this.panel.valueMaps.length; i++) {
        let map = this.panel.valueMaps[i];
        // special null case
        if (map.value === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = map.text;
            return;
          }
          continue;
        }

        // value/number to text mapping
        const value = parseFloat(map.value);
        if (value === data.valueRounded) {
          data.valueFormatted = map.text;
          return;
        }
      }
    } else if (this.panel.mappingType === 2) {
      for (let j = 0; j < this.panel.rangeMaps.length; j++) {
        const rangeMap = this.panel.rangeMaps[j];
        // special null case
        if (rangeMap.from === 'null' && rangeMap.to === 'null') {
          if (data.value === null || data.value === void 0) {
            data.valueFormatted = rangeMap.text;
            return;
          }
          continue;
        }

        // value/number to range mapping
        let from = parseFloat(rangeMap.from);
        let to = parseFloat(rangeMap.to);
        if (to >= data.valueRounded && from <= data.valueRounded) {
          data.valueFormatted = rangeMap.text;
          return;
        }
      }
    }

    if (data.value === null || data.value === void 0) {
      data.valueFormatted = 'no value';
    }
  }

  getValueText() {
    return this.data.valueFormatted;
  }

  getValueRounded() {
    return this.data.valueRounded;
  }

  setUnitFormat(subItem: any) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError(err: any) {
    this.onDataReceived([]);
  }

  onDataReceived(dataList: any) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    let data = {
      value: 0,
      valueFormatted: 0,
      valueRounded: 0,
    };
    this.setValues(data);
    this.data = data;
    if (this.gaugeObject !== null) {
      this.gaugeObject.updateGauge(data.value, data.valueFormatted, data.valueRounded);
    } else {
      // render gauge
      this.render();
    }
  }

  seriesHandler(seriesData: any) {
    let series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  invertColorOrder() {
    let tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }
}
