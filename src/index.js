import echarts from 'echarts';
import { 
    getXAxisData, 
    getSeries,
    SIFormat,
    getMetricTooltip
 } from './utils';

import './index.css';

/**
 * Global controller object is described on Zoomdata knowledge base
 * @see https://www.zoomdata.com/developers/docs/custom-chart-api/controller/
 */

/* global controller */

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/creating-chart-container/
 */
const chartContainer = document.createElement('div');
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

// Dynamic the splitNumber to avoid overlap
echarts.registerProcessor(ecModel => {
    ecModel.findComponents({ mainType: 'yAxis' }).map(component => {
        const defaultSplitNumber = 5;
        const ratio = Math.floor(component.axis.grid.getRect().height / (defaultSplitNumber * component.getTextRect('0').height));
        if (ratio < 1) component.option.axisLabel.show = false;
        else {
            component.option.splitNumber = ratio;
            component.option.axisLabel.show = true;
        }
    });
});

const lineChart = echarts.init(chartContainer);

const option = {
    textStyle: {
        fontFamily: 'Source Pro, source-sans-pro, Helvetica, Arial, sans-serif',
        fontSize: '14',
    },
    grid: {
        left: 40,
        top: 30,
        right: 35,
        bottom: 20,
    },
    xAxis: {
        type: 'category',
        axisPointer: {
            show: true,
            type: 'line',
            label: {
                show: false,
            },
            lineStyle: {
                width: 2,
                type: 'solid',
            }
        },
        splitLine: {
            show: true,
        },
        axisLine: {
            lineStyle: {
                width: 2,
            }
        },
    },
    yAxis: {
        type: 'value',
        axisLine: {
            lineStyle: {
                width: 2,
            }
        },
        axisLabel: {
            formatter: value => SIFormat(value, 2),
        },
    },
    series: [],
}

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/updating-queries-axis-labels/
 */
controller.createAxisLabel({
    picks: 'Multi Group By',
    orientation: 'horizontal',
    position: 'bottom',
});

controller.createAxisLabel({
    picks: 'Y Axis',
    orientation: 'vertical',
    position: 'left'
});

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/receiving-chart-data/
 */
controller.update = data => {
    option.series = [];
    option.xAxis.data = getXAxisData();
    option.series = getSeries(data, option.xAxis.data);
    lineChart.setOption(option, { notMerge: true });
};

controller.resize = () => lineChart.resize();

// Tooltip
lineChart.on('mousemove', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            content: () => {
                return getMetricTooltip(params);
            }
        });
    }
});

// Disabled tooltip and xAxis dotted line on mouse out over item
lineChart.on('mouseout', params => {
    controller.tooltip.hide();
    option.series[params.seriesIndex].markLine.data = null;
    _.unset(option.xAxis.axisPointer.lineStyle, 'color');
    lineChart.setOption(option, { notMerge: true });
});

// xAxis dotted line on item point
lineChart.on('mouseover', params => {
    option.series[params.seriesIndex].markLine.data = [{ yAxis: params.value }];
    option.xAxis.axisPointer.lineStyle.color = params.color;
    lineChart.setOption(option, { notMerge: true });
});

// Menu bar
lineChart.on('click', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.hide();
        controller.menu.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            data: () => params.data.datum,
        });
    }
});
