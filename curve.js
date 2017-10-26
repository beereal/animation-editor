
var CURVECONTROL = {};

CURVECONTROL.Widget = function (opts) {

    "use strict";

    var GRID_SIZE = 10;
    var PADDING = 40;
    var TAU = Math.PI * 2;
    var MAX_WIDTH = 280;
    var MAX_HEIGHT = 280;
    var MARKER_RADIUS = 6;
    var MARKER_INTERACTION_RADIUS = MARKER_RADIUS * 4;
    var ENDPOINT_RADIUS = 7;

    var canvas = document.querySelector('.curve-target');
    var ctx = canvas.getContext('2d');
    var width = 0;
    var height = 0;
    var drawWidth = 0;
    var drawHeight = 0;
    var dPR = window.devicePixelRatio;

    var canvasPosition = null;
    var controlPoint1 = { x: 0.465, y: 0.183 };
    var controlPoint2 = { x: 0.153, y: 0.946 };
    var movingControlPoints = false;
    var currentInteractionPosition = { x: 0, y: 0 };
    var currentInteractionTarget = null;

    var onCurveChange = opts.onCurveChange || null;

    function onWindowResize() {

        width = Math.min(MAX_WIDTH, window.innerWidth);
        height = Math.min(MAX_HEIGHT, window.innerHeight);

        drawWidth = width - PADDING * 2;
        drawHeight = height - PADDING * 2;

        canvas.width = width * dPR;
        canvas.height = height * dPR;

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.scale(dPR, dPR);

        canvasPosition = canvas.getBoundingClientRect();

        draw();
    }

    function setInteractionPositionFromEvent(evt) {

        var target = evt;

        if (evt.touches) {
            target = evt.touches[0];
        }

        currentInteractionPosition.x = target.clientX - canvasPosition.left;
        currentInteractionPosition.y = target.clientY - canvasPosition.top;

    }

    function onStart(evt) {

        setInteractionPositionFromEvent(evt);

        var distanceToControlPoint1X = currentInteractionPosition.x -
            (PADDING + controlPoint1.x * drawWidth);
        var distanceToControlPoint1Y = currentInteractionPosition.y -
            (PADDING + (1 - controlPoint1.y) * drawHeight);

        var distanceToControlPoint2X = currentInteractionPosition.x -
            (PADDING + controlPoint2.x * drawWidth);
        var distanceToControlPoint2Y = currentInteractionPosition.y -
            (PADDING + (1 - controlPoint2.y) * drawHeight);

        var interactionDistanceToControlPoint1 = Math.sqrt(
            distanceToControlPoint1X * distanceToControlPoint1X +
            distanceToControlPoint1Y * distanceToControlPoint1Y
        );

        var interactionDistanceToControlPoint2 = Math.sqrt(
            distanceToControlPoint2X * distanceToControlPoint2X +
            distanceToControlPoint2Y * distanceToControlPoint2Y
        );

        if (interactionDistanceToControlPoint1 < MARKER_INTERACTION_RADIUS)
            currentInteractionTarget = controlPoint1;
        else if (interactionDistanceToControlPoint2 < MARKER_INTERACTION_RADIUS)
            currentInteractionTarget = controlPoint2;

        if (currentInteractionTarget !== null)
            evt.preventDefault();
    }

    function onMove(evt) {

        if (currentInteractionTarget === null)
            return;

        evt.preventDefault();
        setInteractionPositionFromEvent(evt);

        var x = limit(currentInteractionPosition.x, PADDING, PADDING + drawWidth);
        var y = limit(currentInteractionPosition.y, 0,
            PADDING + (PADDING * 0.5) + drawHeight);

        currentInteractionTarget.x = (x - PADDING) / drawWidth;
        currentInteractionTarget.y = 1 - ((y - PADDING) / drawHeight);

        if (onCurveChange)
            onCurveChange();

        draw();
    }

    function onEnd(evt) {
        currentInteractionTarget = null;
    }

    function limit(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getTimingFunctionCSS() {
        return 'cubic-bezier(' +
            controlPoint1.x.toPrecision(3) + ', ' +
            controlPoint1.y.toPrecision(3) + ', ' +
            controlPoint2.x.toPrecision(3) + ', ' +
            controlPoint2.y.toPrecision(3) + ')';
    }

    /* Drawing functions */

    function clear() {
        ctx.clearRect(0, 0, width, height);
    }

    function draw() {
        clear();
        drawGrid();
        drawCurve();
        drawAxes();
        drawMarkerLines();
        drawMarkers();
        drawEndpoints();
    }

    function drawAxes() {
        ctx.save();
        ctx.translate(PADDING, PADDING);

        ctx.fillStyle = '#1F1F1F';
        ctx.strokeStyle = '#1F1F1F';
        ctx.lineWidth = 2;

        // Left axis
        ctx.beginPath();
        ctx.moveTo(0, drawHeight + 1);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.closePath();

        // Left axis arrow
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3, 12);
        ctx.lineTo(-3, 12);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom axis
        ctx.beginPath();
        ctx.moveTo(0, drawHeight);
        ctx.lineTo(drawWidth, drawHeight);
        ctx.stroke();
        ctx.closePath();

        // Bottom axis arrow
        ctx.beginPath();
        ctx.moveTo(drawWidth, drawHeight);
        ctx.lineTo(drawWidth - 12, drawHeight + 3);
        ctx.lineTo(drawWidth - 12, drawHeight - 3);
        ctx.lineTo(drawWidth, drawHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function drawCurve() {
        ctx.save();
        ctx.translate(PADDING + 0.5, PADDING + 0.5);

        ctx.strokeStyle = '#979797';
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(0, drawHeight);
        ctx.bezierCurveTo(
            controlPoint1.x * drawWidth,
            (1 - controlPoint1.y) * drawHeight,
            controlPoint2.x * drawWidth,
            (1 - controlPoint2.y) * drawHeight,
            drawWidth, 0);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    function drawGrid() {

        ctx.save();
        ctx.translate(0.5, 0.5);

        for (var x = GRID_SIZE; x < width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, x + height);

            ctx.globalAlpha = x % 40 === 0 ? 0.1 : 0.05;

            ctx.stroke();
            ctx.closePath();
        }

        for (var y = GRID_SIZE; y < height; y += GRID_SIZE) {

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);

            ctx.globalAlpha = y % 40 === 0 ? 0.1 : 0.05;

            ctx.stroke();
            ctx.closePath();
        }

        ctx.restore();
    }

    function drawMarkerLines() {
        ctx.save();
        ctx.translate(PADDING + 0.5, PADDING + 0.5);

        ctx.strokeStyle = '#979797';

        ctx.beginPath();
        ctx.moveTo(0, drawHeight);
        ctx.lineTo(controlPoint1.x * drawWidth, (1 - controlPoint1.y) * drawHeight);
        ctx.stroke();

        ctx.moveTo(drawWidth, 0);
        ctx.lineTo(controlPoint2.x * drawWidth, (1 - controlPoint2.y) * drawHeight);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    function drawMarkers() {

        ctx.save();
        ctx.translate(PADDING, PADDING);

        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#4285F4';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(controlPoint1.x * drawWidth, (1 - controlPoint1.y) * drawHeight,
            MARKER_RADIUS, 0, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(controlPoint2.x * drawWidth, (1 - controlPoint2.y) * drawHeight,
            MARKER_RADIUS, 0, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function drawEndpoints() {

        ctx.save();
        ctx.translate(PADDING, PADDING);

        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#4285F4';
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.arc(0, drawHeight, ENDPOINT_RADIUS, 0, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(drawWidth, 0, ENDPOINT_RADIUS, 0, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function init() {
        document.addEventListener('touchstart', onStart);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);

        document.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        window.addEventListener('resize', onWindowResize);
        onWindowResize();
    }

    init();

    return {
        getTimingFunctionCSS: getTimingFunctionCSS,
        init: onWindowResize
    };
};

/** Bootstrap **/

var curveControl = new CURVECONTROL.Widget({
    onCurveChange: onCurveChange
});

var test = document.querySelector('.test');

function onCurveChange() {
    test.style.animationTimingFunction = curveControl.getTimingFunctionCSS();
}

onCurveChange();

setTimeout(function() {
    window.dispatchEvent(new Event('resize'));
}, 300);