import * as d3 from 'd3';

export class DrawGauge {
  defaultFonts: any;
  opt: any;
  svg: any;
  circleGroup: any;
  originX: any;
  originY: any;
  needleLengthPos: any;
  needlePathLength: any;
  needlePathStart: any;
  tickStartMaj: any;
  tickStartMin: any;
  labelStart: any;
  innerEdgeRadius: any;
  outerEdgeRadius: any;
  textContent: any;
  needleGroup: any;
  valueLabelParent: any;
  valueLabel: any;
  tickLabelText: any;
  valueScale: any;
  tickAnglesMaj: any;
  tickAnglesMin: any;
  tickSpacingMajDeg: any;
  tickSpacingMinDeg: any;

  constructor(svg: any, opt: any) {
    this.svg = svg;
    // Set defaults if not supplied
    this.opt = this.initOptDefaults(opt);
    // Calculate required values
    this.needleLengthPos =
      opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMaj - opt.needleTickGap;
    this.needlePathLength = opt.needleLengthNeg + this.needleLengthPos;
    this.needlePathStart = opt.needleLengthNeg * -1;
    this.tickStartMaj = opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMaj;
    this.tickStartMin = opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMin;
    this.labelStart = this.tickStartMaj - opt.labelFontSize;
    this.innerEdgeRadius = opt.gaugeRadius - opt.padding - opt.edgeWidth;
    this.outerEdgeRadius = opt.gaugeRadius - opt.padding;
    this.originX = opt.gaugeRadius;
    this.originY = opt.gaugeRadius;

    // Define a linear scale to convert values to needle displacement angle (degrees)
    this.valueScale = d3
      .scaleLinear()
      .domain([this.opt.minVal, this.opt.maxVal])
      .range([this.opt.zeroTickAngle, this.opt.maxTickAngle]);
    // Calculate tick mark angles (degrees)
    let counter = 0;
    this.tickAnglesMaj = [];
    this.tickAnglesMin = [];
    this.tickSpacingMajDeg = this.valueScale(this.opt.tickSpaceMajVal) - this.valueScale(0);
    this.tickSpacingMinDeg = this.valueScale(this.opt.tickSpaceMinVal) - this.valueScale(0);
    for (let i = this.opt.zeroTickAngle; i <= this.opt.maxTickAngle; i = i + this.tickSpacingMajDeg) {
      const tickAngle = this.opt.zeroTickAngle + this.tickSpacingMajDeg * counter;
      // check if this is the "end" of a full circle, and skip the last tick marker
      if (tickAngle - this.opt.zeroTickAngle < 360) {
        this.tickAnglesMaj.push(opt.zeroTickAngle + this.tickSpacingMajDeg * counter);
      }
      counter++;
    }
    counter = 0;
    for (let j = opt.zeroTickAngle; j <= opt.maxTickAngle; j = j + this.tickSpacingMinDeg) {
      // Check for an existing major tick angle
      let exists = 0;
      this.tickAnglesMaj.forEach((d: any) => {
        if (opt.zeroTickAngle + this.tickSpacingMinDeg * counter === d) {
          exists = 1;
        }
      });
      if (exists === 0) {
        this.tickAnglesMin.push(opt.zeroTickAngle + this.tickSpacingMinDeg * counter);
      }
      counter++;
    }
    // Calculate major tick mark label text
    counter = 0;
    this.tickLabelText = [] as any;
    for (let k = this.opt.zeroTickAngle; k <= this.opt.maxTickAngle; k = k + this.tickSpacingMajDeg) {
      const tickValue = this.opt.minVal + this.opt.tickSpaceMajVal * counter;
      const parts = this.opt.tickSpaceMajVal.toString().split('.');
      let tickText = tickValue;
      if (parts.length > 1) {
        tickText = Number(tickValue).toFixed(parts[1].length);
      }
      // check if there are tickMaps that apply
      const tickTextFloat = parseFloat(tickText);
      for (let i = 0; i < this.opt.tickMaps.length; i++) {
        const aTickMap = this.opt.tickMaps[i];
        if (parseFloat(aTickMap.value) === tickTextFloat) {
          tickText = aTickMap.text;
          break;
        }
      }
      this.tickLabelText.push(tickText);
      counter++;
    }
    // Add the svg content holder to the visualisation box element in the document (vizbox)
    // let svgWidth = opt.gaugeRadius * 2, svgHeight = opt.gaugeRadius * 2;
    // Draw the circles that make up the edge of the gauge
    this.circleGroup = this.createCircleGroup();
    if (this.opt.showThresholdOnGauge && this.opt.thresholds.length > 0) {
      // split the threshold values
      const boundaries = this.opt.thresholds.split(',');
      if (this.opt.showLowerThresholdRange) {
        this.drawBand(this.opt.minVal, parseFloat(boundaries[0]), this.opt.thresholdColors[0]);
      }
      if (this.opt.showMiddleThresholdRange) {
        this.drawBand(parseFloat(boundaries[0]), parseFloat(boundaries[1]), this.opt.thresholdColors[1]);
      }
      if (this.opt.showUpperThresholdRange) {
        this.drawBand(parseFloat(boundaries[1]), this.opt.maxVal, this.opt.thresholdColors[2]);
      }
    }
    const pathTickMaj = this.tickCalcMaj();
    const pathTickMin = this.tickCalcMin();
    // Add a group to hold the ticks
    const ticks = this.svg.append('svg:g').attr('id', 'tickMarks');
    // Add a groups for major and minor ticks (minor first, so majors overlay)
    const ticksMin = ticks.append('svg:g').attr('id', 'minorTickMarks');
    const ticksMaj = ticks.append('svg:g').attr('id', 'majorTickMarks');
    // Draw the tick marks
    ticksMin
      .selectAll('path')
      .data(this.tickAnglesMin)
      .enter()
      .append('path')
      .attr('d', pathTickMin)
      .style('stroke', this.opt.tickColMin)
      .style('stroke-width', this.opt.tickWidthMin + 'px');
    ticksMaj
      .selectAll('path')
      .data(this.tickAnglesMaj)
      .enter()
      .append('path')
      .attr('d', pathTickMaj)
      .style('stroke', this.opt.tickColMaj)
      .style('stroke-width', this.opt.tickWidthMaj + 'px');
    // Add labels for major tick marks
    const tickLabels = this.svg.append('svg:g').attr('id', 'tickLabels');
    tickLabels
      .selectAll('text')
      .data(this.tickAnglesMaj)
      .enter()
      .append('text')
      .attr('x', (d: any, i: any) => {
        return this.labelXcalc(d, i);
      })
      .attr('y', (d: any, i: any) => {
        return this.labelYcalc(d, i);
      })
      .attr('font-size', this.opt.labelFontSize)
      .attr('text-anchor', 'middle')
      .style('fill', this.opt.tickLabelCol)
      .style('font-weight', 'bold')
      .attr('font-family', this.opt.tickFont)
      .text((d: any, i: any) => {
        return this.tickLabelText[i];
      });
    // Add label for units
    this.valueLabelParent = svg.append('svg:g').attr('id', 'valueLabels');
    this.valueLabel = this.valueLabelParent
      .selectAll('text')
      .data([0])
      .enter()
      .append('text')
      .attr('x', (d: any, i: any) => {
        return this.labelXcalc(d, i);
      })
      .attr('y', (d: any, i: any) => {
        let y = this.labelYcalc(d, i);
        y = y + this.opt.valueYOffset;
        return y;
      })
      .attr('font-size', this.opt.unitsLabelFontSize)
      .attr('text-anchor', 'middle')
      .style('fill', this.opt.unitsLabelCol)
      .style('font-weight', 'bold')
      .attr('font-family', this.opt.unitsFont)
      .text(this.opt.needleValText); // was just the units, nothing formatted
    // Draw needle
    const needleAngle = [this.opt.zeroNeedleAngle];
    // Define a function for calculating the coordinates of the needle paths (see tick mark equivalent)
    const pathNeedle = this.needleCalc();
    // Add a group to hold the needle path
    this.needleGroup = this.svg.append('svg:g').attr('id', 'needle');
    // Draw the needle path
    const needlePath = this.needleGroup
      .selectAll('path')
      .data(needleAngle)
      .enter()
      .append('path')
      .attr('d', pathNeedle)
      .style('stroke', this.opt.needleCol)
      .style('stroke-width', this.opt.needleWidth + 'px');
    // Animate the transistion of the needle to its starting value
    let transitionSpeed = 0;
    if (this.opt.animateNeedleValueTransition) {
      transitionSpeed = this.opt.animateNeedleValueTransitionSpeed;
    }
    needlePath
      .transition()
      .duration(transitionSpeed)
      .ease(d3.easeQuadIn)
      .attrTween('transform', (d: any, i: any, a: any) => {
        let needleAngle = this.valueScale(this.opt.needleVal);
        // Check for min/max ends of the needle
        if (needleAngle > this.opt.maxTickAngle) {
          needleAngle = this.opt.maxNeedleAngle;
        }
        if (needleAngle < this.opt.zeroTickAngle) {
          needleAngle = this.opt.zeroNeedleAngle;
        }
        const needleCentre = this.originX + ',' + this.originY;
        const needleRot = needleAngle - this.opt.zeroNeedleAngle;
        return d3.interpolateString('rotate(0,' + needleCentre + ')', 'rotate(' + needleRot + ',' + needleCentre + ')');
      });
    this.valueLabelParent.selectAll('text').text(this.opt.needleValText);
  }

  // Function to update the gauge value
  updateGauge(newVal: any, newValFormatted: any, newValRounded: any) {
    // Set default values if necessary
    if (newVal === undefined) {
      newVal = this.opt.minVal;
    }
    // Animate the transistion of the needle to its new value
    const needlePath = this.needleGroup.selectAll('path');
    const oldVal = this.opt.needleVal;
    // snap to new location by default
    let transitionSpeed = 0;
    if (this.opt.animateNeedleValueTransition) {
      transitionSpeed = this.opt.animateNeedleValueTransitionSpeed;
    }
    needlePath
      .transition()
      .duration(transitionSpeed)
      .ease(d3.easeQuadIn)
      .attrTween('transform', (d: any, i: any, a: any) => {
        let needleAngleOld = this.valueScale(oldVal) - this.opt.zeroNeedleAngle;
        let needleAngleNew = this.valueScale(newVal) - this.opt.zeroNeedleAngle;
        // Check for min/max ends of the needle
        if (needleAngleOld + this.opt.zeroNeedleAngle > this.opt.maxTickAngle) {
          needleAngleOld = this.opt.maxNeedleAngle - this.opt.zeroNeedleAngle;
        }
        if (needleAngleOld + this.opt.zeroNeedleAngle < this.opt.zeroTickAngle) {
          needleAngleOld = 0;
        }
        if (needleAngleNew + this.opt.zeroNeedleAngle > this.opt.maxTickAngle) {
          needleAngleNew = this.opt.maxNeedleAngle - this.opt.zeroNeedleAngle;
        }
        if (needleAngleNew + this.opt.zeroNeedleAngle < this.opt.zeroTickAngle) {
          needleAngleNew = 0;
        }
        const needleCentre = this.originX + ',' + this.originY;
        return d3.interpolateString(
          'rotate(' + needleAngleOld + ',' + needleCentre + ')',
          'rotate(' + needleAngleNew + ',' + needleCentre + ')'
        );
      });
    let valueThresholdColor = this.opt.unitsLabelCol;
    if (this.opt.showThresholdColorOnValue) {
      const boundaries = this.opt.thresholds.split(',');
      if (newVal < parseFloat(boundaries[0])) {
        valueThresholdColor = this.opt.thresholdColors[0];
      }
      if (newVal > parseFloat(boundaries[0]) && newVal <= parseFloat(boundaries[1])) {
        valueThresholdColor = this.opt.thresholdColors[1];
      }
      if (newVal >= parseFloat(boundaries[1])) {
        valueThresholdColor = this.opt.thresholdColors[2];
      }
    }
    // fill color
    this.valueLabel.style('fill', valueThresholdColor);
    this.valueLabelParent.selectAll('text').text(newValFormatted);
    // Update the current value
    this.opt.needleVal = newVal;
  }

  initOptDefaults(opt: any) {
    if (typeof opt.gaugeRadius === 'undefined') {
      opt.gaugeRadius = 200;
    }
    if (typeof opt.minVal === 'undefined') {
      opt.minVal = 0;
    }
    if (typeof opt.maxVal === 'undefined') {
      opt.maxVal = 100;
    }
    if (typeof opt.tickSpaceMinVal === 'undefined') {
      opt.tickSpaceMinVal = 1;
    }
    if (typeof opt.tickSpaceMajVal === 'undefined') {
      opt.tickSpaceMajVal = 10;
    }
    if (typeof opt.needleVal === 'undefined') {
      opt.needleVal = 60;
    }
    if (typeof opt.needleValText === 'undefined') {
      opt.needleValText = '60';
    }
    if (typeof opt.gaugeUnits === 'undefined') {
      opt.gaugeUnits = '%';
    }
    if (typeof opt.padding === 'undefined') {
      opt.padding = 0.05;
    }
    if (typeof opt.edgeWidth === 'undefined') {
      opt.edgeWidth = 0.05;
    }
    if (typeof opt.tickEdgeGap === 'undefined') {
      opt.tickEdgeGap = 0.05;
    }
    if (typeof opt.tickLengthMaj === 'undefined') {
      opt.tickLengthMaj = 0.15;
    }
    if (typeof opt.tickLengthMin === 'undefined') {
      opt.tickLengthMin = 0.05;
    }
    if (typeof opt.needleTickGap === 'undefined') {
      opt.needleTickGap = 0.05;
    }
    if (typeof opt.needleLengthNeg === 'undefined') {
      opt.needleLengthNeg = 0.2;
    }
    if (typeof opt.pivotRadius === 'undefined') {
      opt.pivotRadius = 0.1;
    }
    if (typeof opt.ticknessGaugeBasis === 'undefined') {
      opt.ticknessGaugeBasis = 200;
    }
    if (typeof opt.needleWidth === 'undefined') {
      opt.needleWidth = 5;
    }
    if (typeof opt.tickWidthMaj === 'undefined') {
      opt.tickWidthMaj = 3;
    }
    if (typeof opt.tickWidthMin === 'undefined') {
      opt.tickWidthMin = 1;
    }
    if (typeof opt.labelFontSize === 'undefined') {
      opt.labelFontSize = 18;
    }
    if (typeof opt.unitsLabelFontSize === 'undefined') {
      opt.unitsLabelFontSize = 22;
    }
    if (typeof opt.zeroTickAngle === 'undefined') {
      opt.zeroTickAngle = 60;
    }
    if (typeof opt.maxTickAngle === 'undefined') {
      opt.maxTickAngle = 300;
    }
    if (typeof opt.zeroNeedleAngle === 'undefined') {
      opt.zeroNeedleAngle = 40;
    }
    if (typeof opt.maxNeedleAngle === 'undefined') {
      opt.maxNeedleAngle = 320;
    }
    if (typeof opt.tickColMaj === 'undefined') {
      opt.tickColMaj = '#0099CC';
    }
    if (typeof opt.tickColMin === 'undefined') {
      opt.tickColMin = '#000';
    }
    if (typeof opt.outerEdgeCol === 'undefined') {
      opt.outerEdgeCol = '#0099CC';
    }
    if (typeof opt.pivotCol === 'undefined') {
      opt.pivotCol = '#999';
    }
    if (typeof opt.innerCol === 'undefined') {
      opt.innerCol = '#fff';
    }
    if (typeof opt.unitsLabelCol === 'undefined') {
      opt.unitsLabelCol = '#000';
    }
    if (typeof opt.tickLabelCol === 'undefined') {
      opt.tickLabelCol = '#000';
    }
    if (typeof opt.needleCol === 'undefined') {
      opt.needleCol = '#0099CC';
    }
    this.defaultFonts = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    if (typeof opt.tickFont === 'undefined') {
      opt.tickFont = this.defaultFonts;
    }
    if (typeof opt.unitsFont === 'undefined') {
      opt.unitsFont = this.defaultFonts;
    }
    if (typeof opt.valueYOffset === 'undefined') {
      opt.valueYOffset = 0;
    }
    if (typeof opt.showThresholdOnGauge === 'undefined') {
      opt.showThresholdOnGauge = false;
    }
    if (typeof opt.showThresholdColorOnValue === 'undefined') {
      opt.showThresholdColorOnValue = false;
    }
    if (typeof opt.showLowerThresholdRange === 'undefined') {
      opt.showLowerThresholdRange = false;
    }
    if (typeof opt.showMiddleThresholdRange === 'undefined') {
      opt.showMiddleThresholdRange = true;
    }
    if (typeof opt.showUpperThresholdRange === 'undefined') {
      opt.showUpperThresholdRange = true;
    }
    if (typeof opt.thresholdColors === 'undefined') {
      opt.thresholdColors = ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'];
    }
    if (typeof opt.animateNeedleValueTransition === 'undefined') {
      opt.animateNeedleValueTransition = true;
    }
    // default transition speed 500ms
    if (typeof opt.animateNeedleValueTransitionSpeed === 'undefined') {
      opt.animateNeedleValueTransitionSpeed = 100;
    }
    //
    if (typeof opt.tickMaps === 'undefined') {
      opt.tickMaps = [];
    }
    // Calculate absolute values
    opt.padding = opt.padding * opt.gaugeRadius;
    opt.edgeWidth = opt.edgeWidth * opt.gaugeRadius;
    opt.tickEdgeGap = opt.tickEdgeGap * opt.gaugeRadius;
    opt.tickLengthMaj = opt.tickLengthMaj * opt.gaugeRadius;
    opt.tickLengthMin = opt.tickLengthMin * opt.gaugeRadius;
    opt.needleTickGap = opt.needleTickGap * opt.gaugeRadius;
    opt.needleLengthNeg = opt.needleLengthNeg * opt.gaugeRadius;
    opt.pivotRadius = opt.pivotRadius * opt.gaugeRadius;
    opt.needleWidth = opt.needleWidth * (opt.gaugeRadius / opt.ticknessGaugeBasis);
    opt.tickWidthMaj = opt.tickWidthMaj * (opt.gaugeRadius / opt.ticknessGaugeBasis);
    opt.tickWidthMin = opt.tickWidthMin * (opt.gaugeRadius / opt.ticknessGaugeBasis);
    opt.labelFontSize = opt.labelFontSize * (opt.gaugeRadius / opt.ticknessGaugeBasis);
    opt.unitsLabelFontSize = opt.unitsLabelFontSize * (opt.gaugeRadius / opt.ticknessGaugeBasis);
    if (opt.labelFontSize < 6) {
      opt.labelFontSize = 0;
    }
    return opt;
  }

  drawBand(start: any, end: any, color: any) {
    if (0 >= end - start) {
      return;
    }
    this.circleGroup
      .append('svg:path')
      .style('fill', color)
      .attr(
        'd',
        d3
          .arc()
          .startAngle(this.valueToRadians(start))
          .endAngle(this.valueToRadians(end))
          .innerRadius(0.7 * this.opt.gaugeRadius)
          .outerRadius(0.85 * this.opt.gaugeRadius)
      )
      .attr('transform', () => {
        return 'translate(' + this.originX + ', ' + this.originY + ') rotate(' + this.opt.maxTickAngle + ')';
      });
  }

  createCircleGroup() {
    const circleGroup = this.svg.append('svg:g').attr('id', 'circles');
    circleGroup
      .append('svg:circle')
      .attr('cx', this.originX)
      .attr('cy', this.originY)
      .attr('r', this.outerEdgeRadius)
      .style('fill', this.opt.outerEdgeCol)
      .style('stroke', 'none');
    circleGroup
      .append('svg:circle')
      .attr('cx', this.originX)
      .attr('cy', this.originY)
      .attr('r', this.innerEdgeRadius)
      .style('fill', this.opt.innerCol)
      .style('stroke', 'none');
    // Draw the circle for the needle 'pivot'
    circleGroup
      .append('svg:circle')
      .attr('cx', this.originX)
      .attr('cy', this.originY)
      .attr('r', this.opt.pivotRadius)
      .style('fill', this.opt.pivotCol)
      .style('stroke', 'none');
    return circleGroup;
  }
  valueToDegrees(value: any) {
    // degree range is from 60 to 300 (240)  maxTickAngle - zeroTickAngle
    const degreeRange = this.opt.maxTickAngle - this.opt.zeroTickAngle;
    const range = this.opt.maxVal - this.opt.minVal;
    const min = this.opt.minVal;
    return (value / range) * degreeRange - ((min / range) * degreeRange + this.opt.zeroTickAngle);
  }

  valueToRadians(value: any) {
    return (this.valueToDegrees(value) * Math.PI) / 180;
  }

  // Define two functions for calculating the coordinates of the major & minor tick mark paths
  tickCalcMaj() {
    return (d: any, i: any) => {
      // Offset the tick mark angle so zero is vertically down, then convert to radians
      const tickAngle = d + 90;
      const tickAngleRad = dToR(tickAngle);
      const y1 = this.originY + this.tickStartMaj * Math.sin(tickAngleRad);
      const y2 = this.originY + (this.tickStartMaj + this.opt.tickLengthMaj) * Math.sin(tickAngleRad);
      const x1 = this.originX + this.tickStartMaj * Math.cos(tickAngleRad);
      const x2 = this.originX + (this.tickStartMaj + this.opt.tickLengthMaj) * Math.cos(tickAngleRad);
      // Use a D3.JS path generator
      const lineSVG = d3.line()([
        [x1, y1],
        [x2, y2],
      ]);
      return lineSVG;
    };
  }

  tickCalcMin() {
    return (d: any, i: any) => {
      // Offset the tick mark angle so zero is vertically down, then convert to radians
      const tickAngle = d + 90;
      const tickAngleRad = dToR(tickAngle);
      const y1 = this.originY + this.tickStartMin * Math.sin(tickAngleRad);
      const y2 = this.originY + (this.tickStartMin + this.opt.tickLengthMin) * Math.sin(tickAngleRad);
      const x1 = this.originX + this.tickStartMin * Math.cos(tickAngleRad);
      const x2 = this.originX + (this.tickStartMin + this.opt.tickLengthMin) * Math.cos(tickAngleRad);
      const lineSVG = d3.line()([
        [x1, y1],
        [x2, y2],
      ]);
      return lineSVG;
    };
  }

  needleCalc() {
    return (d: any, i: any) => {
      const nAngleRad = dToR(d + 90);
      const y1 = this.originY + this.needlePathStart * Math.sin(nAngleRad);
      const y2 = this.originY + (this.needlePathStart + this.needlePathLength) * Math.sin(nAngleRad);
      const x1 = this.originX + this.needlePathStart * Math.cos(nAngleRad);
      const x2 = this.originX + (this.needlePathStart + this.needlePathLength) * Math.cos(nAngleRad);
      const lineSVG = d3.line()([
        [x1, y1],
        [x2, y2],
      ]);
      return lineSVG;
    };
  }

  // Define functions to calcuate the positions of the labels for the tick marks
  labelXcalc(d: any, i: any) {
    const tickAngle = d + 90;
    const tickAngleRad = dToR(tickAngle);
    const labelW = this.opt.labelFontSize / (this.tickLabelText[i].toString().length / 2);
    const x1 = this.originX + (this.labelStart - labelW) * Math.cos(tickAngleRad);
    return x1;
  }

  labelYcalc(d: any, i: any) {
    const tickAngle = d + 90;
    const tickAngleRad = dToR(tickAngle);
    const y1 = this.originY + this.labelStart * Math.sin(tickAngleRad) + this.opt.labelFontSize / 2;
    return y1;
  }
}

function dToR(angleDeg: any) {
  // Turns an angle in degrees to radians
  const angleRad = angleDeg * (Math.PI / 180);
  return angleRad;
}
