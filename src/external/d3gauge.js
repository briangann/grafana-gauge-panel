function drawGauge(svg,opt) {
  // Set defaults if not supplied
  //if(typeof opt === 'undefined')                  {var opt={}}
  if(typeof opt.gaugeRadius === 'undefined')      {opt.gaugeRadius=200;}
  if(typeof opt.minVal === 'undefined')           {opt.minVal=0;}
  if(typeof opt.maxVal === 'undefined')           {opt.maxVal=100;}
  if(typeof opt.tickSpaceMinVal === 'undefined')  {opt.tickSpaceMinVal=1;}
  if(typeof opt.tickSpaceMajVal === 'undefined')  {opt.tickSpaceMajVal=10;}
  if(typeof opt.needleVal === 'undefined')        {opt.needleVal=60;}
  if(typeof opt.needleValText === 'undefined')    {opt.needleValText='60';}
  if(typeof opt.gaugeUnits === 'undefined')       {opt.gaugeUnits="%";}

  if(typeof opt.padding === 'undefined')          {opt.padding=0.05;}
  if(typeof opt.edgeWidth === 'undefined')        {opt.edgeWidth=0.05;}
  if(typeof opt.tickEdgeGap === 'undefined')      {opt.tickEdgeGap=0.05;}
  if(typeof opt.tickLengthMaj === 'undefined')    {opt.tickLengthMaj=0.15;}
  if(typeof opt.tickLengthMin === 'undefined')    {opt.tickLengthMin=0.05;}
  if(typeof opt.needleTickGap === 'undefined')    {opt.needleTickGap=0.05;}
  if(typeof opt.needleLengthNeg === 'undefined')  {opt.needleLengthNeg=0.2;}
  if(typeof opt.pivotRadius === 'undefined')      {opt.pivotRadius=0.1;}

  if(typeof opt.ticknessGaugeBasis === 'undefined') {opt.ticknessGaugeBasis=200;}
  if(typeof opt.needleWidth === 'undefined')      {opt.needleWidth=5;}
  if(typeof opt.tickWidthMaj === 'undefined')     {opt.tickWidthMaj=3;}
  if(typeof opt.tickWidthMin === 'undefined')     {opt.tickWidthMin=1;}
  if(typeof opt.labelFontSize === 'undefined')    {opt.labelFontSize=18;}
  if(typeof opt.unitsLabelFontSize === 'undefined')    {opt.unitsLabelFontSize=22;}
  if(typeof opt.zeroTickAngle === 'undefined')    {opt.zeroTickAngle=60;}
  if(typeof opt.maxTickAngle === 'undefined')     {opt.maxTickAngle=300;}
  if(typeof opt.zeroNeedleAngle === 'undefined')  {opt.zeroNeedleAngle=40;}
  if(typeof opt.maxNeedleAngle === 'undefined')   {opt.maxNeedleAngle=320;}

  if(typeof opt.tickColMaj === 'undefined')       {opt.tickColMaj = '#0099CC';}
  if(typeof opt.tickColMin === 'undefined')       {opt.tickColMin = '#000';}
  if(typeof opt.outerEdgeCol === 'undefined')     {opt.outerEdgeCol = '#0099CC';}
  if(typeof opt.pivotCol === 'undefined')         {opt.pivotCol = '#999';}
  if(typeof opt.innerCol === 'undefined')         {opt.innerCol = '#fff';}
  if(typeof opt.unitsLabelCol === 'undefined')    {opt.unitsLabelCol = '#000';}
  if(typeof opt.tickLabelCol === 'undefined')     {opt.tickLabelCol = '#000';}
  if(typeof opt.needleCol === 'undefined')        {opt.needleCol = '#0099CC';}

  defaultFonts = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  if(typeof opt.tickFont === 'undefined')        {opt.tickFont = defaultFonts;}
  if(typeof opt.unitsFont === 'undefined')        {opt.unitsFont = defaultFonts;}
  if(typeof opt.valueYOffset === 'undefined')        {opt.valueYOffset = 0;}

  if(typeof opt.showThresholdOnGauge === 'undefined') {opt.showThresholdOnGauge = false;}
  if(typeof opt.showThresholdColorOnValue === 'undefined') {opt.showThresholdColorOnValue = false;}
  if(typeof opt.showLowerThresholdRange === 'undefined') {opt.showLowerThresholdRange = false;}
  if(typeof opt.showMiddleThresholdRange === 'undefined') {opt.showMiddleThresholdRange = true; }
  if(typeof opt.showUpperThresholdRange === 'undefined') {opt.showUpperThresholdRange = true;}
  if(typeof opt.thresholdColors === 'undefined') {
    opt.thresholdColors = ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"];
  }
  if(typeof opt.animateNeedleValueTransition === 'undefined') {opt.animateNeedleValueTransition = true;}
  // default transition speed 500ms
  if(typeof opt.animateNeedleValueTransitionSpeed === 'undefined') {opt.animateNeedleValueTransitionSpeed = 100;}
  //
  if(typeof opt.tickMaps === 'undefined') {opt.tickMaps = [];}
  // Calculate absolute values
  opt.padding = opt.padding * opt.gaugeRadius;
  opt.edgeWidth = opt.edgeWidth * opt.gaugeRadius;
  opt.tickEdgeGap = opt.tickEdgeGap * opt.gaugeRadius;
  opt.tickLengthMaj = opt.tickLengthMaj * opt.gaugeRadius;
  opt.tickLengthMin = opt.tickLengthMin * opt.gaugeRadius;
  opt.needleTickGap = opt.needleTickGap * opt.gaugeRadius;
  opt.needleLengthNeg = opt.needleLengthNeg * opt.gaugeRadius;
  opt.pivotRadius = opt.pivotRadius * opt.gaugeRadius;

  opt.needleWidth = opt.needleWidth * (opt.gaugeRadius/opt.ticknessGaugeBasis);
  opt.tickWidthMaj = opt.tickWidthMaj * (opt.gaugeRadius/opt.ticknessGaugeBasis);
  opt.tickWidthMin = opt.tickWidthMin * (opt.gaugeRadius/opt.ticknessGaugeBasis);
  opt.labelFontSize = opt.labelFontSize * (opt.gaugeRadius/opt.ticknessGaugeBasis);
  opt.unitsLabelFontSize = opt.unitsLabelFontSize * (opt.gaugeRadius/opt.ticknessGaugeBasis);

  //Calculate required values
  var needleLengthPos = opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMaj - opt.needleTickGap,
      needlePathLength = opt.needleLengthNeg + needleLengthPos,
      needlePathStart = opt.needleLengthNeg * (-1),
      tickStartMaj = opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMaj,
      tickStartMin = opt.gaugeRadius - opt.padding - opt.edgeWidth - opt.tickEdgeGap - opt.tickLengthMin,
      labelStart = tickStartMaj - opt.labelFontSize,
      innerEdgeRadius = opt.gaugeRadius - opt.padding - opt.edgeWidth,
      outerEdgeRadius = opt.gaugeRadius - opt.padding,
      originX = opt.gaugeRadius,
      originY = opt.gaugeRadius;

  if(opt.labelFontSize < 6){opt.labelFontSize = 0;}

  //Define a linear scale to convert values to needle displacement angle (degrees)
  var valueScale = d3.scale.linear()
          .domain([opt.minVal, opt.maxVal])
          .range([opt.zeroTickAngle, opt.maxTickAngle]);

  //Calculate tick mark angles (degrees)
  var counter = 0,
      tickAnglesMaj = [],
      tickAnglesMin = [],
      tickSpacingMajDeg = valueScale(opt.tickSpaceMajVal) - valueScale(0),
      tickSpacingMinDeg = valueScale(opt.tickSpaceMinVal) - valueScale(0);

  for (var i = opt.zeroTickAngle; i <= opt.maxTickAngle; i = i + tickSpacingMajDeg) {
    var tickAngle = (opt.zeroTickAngle + (tickSpacingMajDeg * counter))
    // check if this is the "end" of a full circle, and skip the last tick marker
    if ((tickAngle - opt.zeroTickAngle) < 360) {
      //console.log("adding tick at angle " + tickAngle)
      tickAnglesMaj.push(opt.zeroTickAngle + (tickSpacingMajDeg * counter));
    }
    counter++;
  }

  counter = 0;
  for (var j = opt.zeroTickAngle; j <= opt.maxTickAngle; j = j + tickSpacingMinDeg) {
    //Check for an existing major tick angle
    var exists = 0;
    tickAnglesMaj.forEach(function(d) {
      if((opt.zeroTickAngle + (tickSpacingMinDeg * counter))==d){exists=1;}
    });

    if(exists === 0) {
      tickAnglesMin.push(opt.zeroTickAngle + (tickSpacingMinDeg * counter));
    }
    counter++;
  }

  //Calculate major tick mark label text
  counter=0;
  var tickLabelText=[];
  for (var k = opt.zeroTickAngle; k <= opt.maxTickAngle; k = k + tickSpacingMajDeg) {
    let tickValue = opt.minVal + (opt.tickSpaceMajVal * counter);
    var parts = opt.tickSpaceMajVal.toString().split('.');
    if (parts.length > 1) {
      tickText = Number(tickValue).toFixed(parts[1].length);
    } else {
      tickText = tickValue;
    }
    //console.log("TickText = " + tickText);
    // check if there are tickMaps that apply
    let tickTextFloat = parseFloat(tickText);
    for (let i = 0; i < opt.tickMaps.length; i++) {
      let aTickMap = opt.tickMaps[i];
      //console.log("Checking tickMap " + i);
      if (parseFloat(aTickMap.value) === tickTextFloat) {
        //console.log("found tickmap, value is mapped to " + aTickMap.text);
        tickText = aTickMap.text;
        break;
      }
    }
    tickLabelText.push(tickText);
    counter++;
  }
  //Add the svg content holder to the visualisation box element in the document (vizbox)
  var svgWidth=opt.gaugeRadius * 2,
      svgHeight=opt.gaugeRadius * 2;

  //Draw the circles that make up the edge of the gauge
  var circleGroup = svg.append("svg:g")
          .attr("id","circles");
  var outerC = circleGroup.append("svg:circle")
          .attr("cx", originX)
          .attr("cy", originY)
          .attr("r", outerEdgeRadius)
          .style("fill", opt.outerEdgeCol)
          .style("stroke", "none");
  var innerC = circleGroup.append("svg:circle")
          .attr("cx", originX)
          .attr("cy", originY)
          .attr("r", innerEdgeRadius)
          .style("fill", opt.innerCol)
          .style("stroke", "none");

  //Draw the circle for the needle 'pivot'
  var pivotC = circleGroup.append("svg:circle")
          .attr("cx", originX)
          .attr("cy", originY)
          .attr("r", opt.pivotRadius)
          .style("fill", opt.pivotCol)
          .style("stroke", "none");

  valueToDegrees = function(value) {
    // degree range is from 60 to 300 (240)  maxTickAngle - zeroTickAngle
    var degreeRange = opt.maxTickAngle - opt.zeroTickAngle;
    var range = opt.maxVal - opt.minVal;
    var min = opt.minVal;
    return value / range * degreeRange - (min / range * degreeRange + opt.zeroTickAngle);
    //return value / this.config.range * 270 - (this.config.min / this.config.range * 270 + 45);
  };

  valueToRadians = function(value) {
    return this.valueToDegrees(value) * Math.PI / 180;
  };

  drawBand = function(start, end, color) {
    if (0 >= end - start) return;
    circleGroup.append("svg:path")
      .style("fill", color)
      .attr("d", d3.svg.arc()
      .startAngle(this.valueToRadians(start))
      .endAngle(this.valueToRadians(end))
      .innerRadius(0.70 * opt.gaugeRadius)
      .outerRadius(0.85 * opt.gaugeRadius))
      .attr("transform", function() {
        return "translate(" + originX + ", " + originY + ") rotate(" + opt.maxTickAngle + ")";
      });
  };
  if (opt.showThresholdOnGauge && opt.thresholds.length > 0) {
    // split the threshold values
    var boundaries = opt.thresholds.split(',');
    if (opt.showLowerThresholdRange) {
      drawBand(opt.minVal, parseFloat(boundaries[0]), opt.thresholdColors[0]);
    }
    if (opt.showMiddleThresholdRange) {
      drawBand(parseFloat(boundaries[0]), parseFloat(boundaries[1]), opt.thresholdColors[1]);
    }
    if (opt.showUpperThresholdRange) {
      drawBand(parseFloat(boundaries[1]), opt.maxVal, opt.thresholdColors[2]);
    }
  }
  //Define two functions for calculating the coordinates of the major & minor tick mark paths
  tickCalcMaj = function() {
    function pathCalc(d,i) {
      //Offset the tick mark angle so zero is vertically down, then convert to radians
      var tickAngle = d + 90,
          tickAngleRad = dToR(tickAngle);

      var y1 = originY + (tickStartMaj * Math.sin(tickAngleRad)),
          y2 = originY + ((tickStartMaj + opt.tickLengthMaj) * Math.sin(tickAngleRad)),
          x1 = originX + (tickStartMaj * Math.cos(tickAngleRad)),
          x2 = originX + ((tickStartMaj + opt.tickLengthMaj) * Math.cos(tickAngleRad)),
          lineData = [{"x": x1, "y": y1}, {"x": x2, "y": y2}];

      //Use a D3.JS path generator
      var lineFunc = d3.svg.line()
          .x(function(d) {return d.x;})
          .y(function(d) {return d.y;});

      var lineSVG = lineFunc(lineData);

      return lineSVG;
    }
    return pathCalc;
  };

  tickCalcMin = function() {
    function pathCalc(d,i) {
      //Offset the tick mark angle so zero is vertically down, then convert to radians
      var tickAngle = d + 90,
          tickAngleRad = dToR(tickAngle);

      var y1 = originY + (tickStartMin * Math.sin(tickAngleRad)),
          y2 = originY + ((tickStartMin + opt.tickLengthMin) * Math.sin(tickAngleRad)),
          x1 = originX + (tickStartMin * Math.cos(tickAngleRad)),
          x2 = originX + ((tickStartMin + opt.tickLengthMin) * Math.cos(tickAngleRad)),
          lineData = [{"x": x1, "y": y1}, {"x": x2, "y": y2}];

      //Use a D3.JS path generator
      var lineFunc=d3.svg.line()
          .x(function(d) {return d.x;})
          .y(function(d) {return d.y;});

      var lineSVG = lineFunc(lineData);

      return lineSVG;
    }
    return pathCalc;
  };

  var pathTickMaj = tickCalcMaj(),
      pathTickMin = tickCalcMin();

  //Add a group to hold the ticks
  var ticks = svg.append("svg:g")
                .attr("id","tickMarks");

  //Add a groups for major and minor ticks (minor first, so majors overlay)
  var ticksMin = ticks.append("svg:g")
                .attr("id","minorTickMarks");
  var ticksMaj = ticks.append("svg:g")
                .attr("id","majorTickMarks");

  //Draw the tick marks
  var tickMin = ticksMin.selectAll("path")
                .data(tickAnglesMin)
                .enter().append("path")
                .attr("d", pathTickMin)
                .style("stroke", opt.tickColMin)
                .style("stroke-width", opt.tickWidthMin+"px");
  var tickMaj = ticksMaj.selectAll("path")
                .data(tickAnglesMaj)
                .enter().append("path")
                .attr("d", pathTickMaj)
                .style("stroke", opt.tickColMaj)
                .style("stroke-width", opt.tickWidthMaj+"px");

  //Define functions to calcuate the positions of the labels for the tick marks
  function labelXcalc(d,i) {
    var tickAngle = d+90,
        tickAngleRad = dToR(tickAngle),
        labelW = opt.labelFontSize / (tickLabelText[i].toString().length / 2);
    x1 = originX + ((labelStart - labelW) * Math.cos(tickAngleRad));
    return x1;
  }
  function labelYcalc(d,i) {
    var tickAngle=d+90,
        tickAngleRad=dToR(tickAngle),
        y1 = originY + ((labelStart) * Math.sin(tickAngleRad)) + (opt.labelFontSize/2);
    return y1;
  }

  //Add labels for major tick marks
  var tickLabels = svg.append("svg:g")
                .attr("id", "tickLabels");
  var tickLabel = tickLabels.selectAll("text")
                .data(tickAnglesMaj)
                .enter().append("text")
                .attr("x",function(d,i) { return labelXcalc(d,i); })
                .attr("y",function(d,i) { return labelYcalc(d,i); })
                .attr("font-size", opt.labelFontSize)
                .attr("text-anchor", "middle")
                .style("fill", opt.tickLabelCol)
                .style("font-weight", "bold")
                .attr("font-family", opt.tickFont)
                .text(function(d,i) { return tickLabelText[i]; });

  //Add label for units
  var unitLabels = svg.append("svg:g")
                .attr("id", "unitLabels");
  var unitsLabel = unitLabels.selectAll("text")
                .data([0])
                .enter().append("text")
                .attr("x",function(d,i) { return labelXcalc(d,i); })
                .attr("y",function(d,i) {
                  var y = labelYcalc(d,i);
                  y = y + opt.valueYOffset;
                  return y;
                  //return labelYcalc(d,i);
                })
                .attr("font-size", opt.unitsLabelFontSize)
                .attr("text-anchor", "middle")
                .style("fill", opt.unitsLabelCol)
                .style("font-weight", "bold")
                .attr("font-family", opt.unitsFont)
                .text(opt.gaugeUnits);

  //Draw needle
  var needleAngle = [opt.zeroNeedleAngle];

  //Define a function for calculating the coordinates of the needle paths (see tick mark equivalent)
  needleCalc = function() {
    function pathCalc(d,i) {
      var nAngleRad = dToR(d + 90);

      var y1 = originY + (needlePathStart * Math.sin(nAngleRad)),
          y2 = originY + ((needlePathStart + needlePathLength) * Math.sin(nAngleRad)),
          x1 = originX + (needlePathStart * Math.cos(nAngleRad)),
          x2 = originX + ((needlePathStart + needlePathLength) * Math.cos(nAngleRad)),
          lineData = [{"x": x1, "y": y1}, {"x": x2, "y": y2}];

      var lineFunc=d3.svg.line()
                    .x(function(d) { return d.x; })
                    .y(function(d) { return d.y; });

      var lineSVG = lineFunc(lineData);
      return lineSVG;
    }
    return pathCalc;
  };

  var pathNeedle = needleCalc();

  //Add a group to hold the needle path
  var needleGroup = svg.append("svg:g")
      .attr("id","needle");

  //Draw the needle path
  var needlePath = needleGroup.selectAll("path")
      .data(needleAngle)
      .enter().append("path")
      .attr("d", pathNeedle)
      .style("stroke", opt.needleCol)
      .style("stroke-width", opt.needleWidth + "px");

  //Animate the transistion of the needle to its starting value
  var easeType = "quadin";
  var transitionSpeed = 0;
  if (opt.animateNeedleValueTransition) {
    //easeType = "quadin";
    transitionSpeed = opt.animateNeedleValueTransitionSpeed
  }
  needlePath.transition()
    .duration(transitionSpeed)
    .ease(easeType,1,0.9)
    .attrTween("transform", function(d,i,a) {
      needleAngle=valueScale(opt.needleVal);
      //Check for min/max ends of the needle
      if (needleAngle > opt.maxTickAngle) { needleAngle = opt.maxNeedleAngle; }
      if (needleAngle < opt.zeroTickAngle) { needleAngle = opt.zeroNeedleAngle; }
      var needleCentre = originX + "," + originY,
          needleRot = needleAngle - opt.zeroNeedleAngle;
      return d3.interpolateString("rotate(0," + needleCentre + ")", "rotate(" + needleRot + "," + needleCentre + ")");
    });

  unitsLabel.transition()
    .duration(transitionSpeed)
    .ease(easeType,1,0.9)
    .tween("text", function(d) {
      var i = d3.interpolateString(opt.minVal, opt.needleVal);

      return function(t) {
        //this.textContent = Math.round(i(t)) + " " + opt.gaugeUnits;
        this.textContent = opt.needleValText;
      };
    });

  // Function to update the gauge value
  this.updateGauge=function(newVal, newValFormatted, newValRounded) {
    //Set default values if necessary
    if(newVal === undefined) {
      newVal = opt.minVal;
    }
    //Animate the transistion of the needle to its new value
    var needlePath = needleGroup.selectAll("path");
    var oldVal = opt.needleVal;
    var easeType = "quadin";
    // snap to new location by default
    var transitionSpeed = 0;
    if (opt.animateNeedleValueTransition) {
      //easeType = "quadin";
      transitionSpeed = opt.animateNeedleValueTransitionSpeed
    }
    needlePath.transition()
        .duration(transitionSpeed)
        .ease(easeType,1,0.9)
        .attrTween("transform", function(d,i,a) {
          needleAngleOld = valueScale(oldVal) - opt.zeroNeedleAngle;
          needleAngleNew = valueScale(newVal) - opt.zeroNeedleAngle;
          //Check for min/max ends of the needle
          if (needleAngleOld + opt.zeroNeedleAngle > opt.maxTickAngle) { needleAngleOld = opt.maxNeedleAngle - opt.zeroNeedleAngle; }
          if (needleAngleOld + opt.zeroNeedleAngle < opt.zeroTickAngle) { needleAngleOld = 0; }
          if (needleAngleNew + opt.zeroNeedleAngle > opt.maxTickAngle) { needleAngleNew = opt.maxNeedleAngle - opt.zeroNeedleAngle; }
          if (needleAngleNew + opt.zeroNeedleAngle < opt.zeroTickAngle) { needleAngleNew = 0; }
          var needleCentre = originX+","+originY;
          return d3.interpolateString("rotate(" + needleAngleOld + "," + needleCentre + ")", "rotate(" + needleAngleNew + "," + needleCentre + ")");
        });

    var valueThresholdColor = opt.unitsLabelCol;
    if (opt.showThresholdColorOnValue) {
      var boundaries = opt.thresholds.split(',');
      if (newVal < parseFloat(boundaries[0])) {
        valueThresholdColor = opt.thresholdColors[0];
      }
      if ((newVal > parseFloat(boundaries[0])) && (newVal <= parseFloat(boundaries[1]))) {
        valueThresholdColor = opt.thresholdColors[1];
      }
      if (newVal >= parseFloat(boundaries[1])) {
        valueThresholdColor = opt.thresholdColors[2];
      }
    }
    unitsLabel.style("fill", valueThresholdColor);

    unitsLabel.transition()
      .duration(transitionSpeed)
      .ease(easeType,1,0.9)
      .tween("text", function(d) {
        var i = d3.interpolateString(oldVal, newVal);
        return function(t) {
          //this.textContent = Math.round(i(t)) + " " + opt.gaugeUnits;
          this.textContent = newValFormatted;
        };
      });

    //Update the current value
    opt.needleVal = newVal;
  };
}

function dToR(angleDeg){
  //Turns an angle in degrees to radians
  var angleRad = angleDeg * (Math.PI / 180);
  return angleRad;
}
