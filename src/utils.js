import visualization from '../visualization.json';

// Variables Accessors
const multiGroupAccessor = controller.dataAccessors[visualization.variables[0].name];
const YAxisAccessor = controller.dataAccessors[visualization.variables[1].name]

const getDataDomain = () => _.last(multiGroupAccessor._accessors).getDomain();

const mapDataDomain = data => data.map(date => multiGroupAccessor.format(date, 1));

const getMetricValue = datum => YAxisAccessor._getValue(datum);

const getTableRow = (label, value, color='') => `<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value">${color} ${value}</div></div>`;

const getTrendAttributeTooltip = params => {
    const trendAccessor = _.last(multiGroupAccessor._accessors);
    if (params.name && trendAccessor) {
        const accessorGroup = trendAccessor.getGroup();
        const label = `${accessorGroup.label} ${trendAccessor._timeZoneId} (${accessorGroup.func})`;
        return `<div class="zd_tooltip_info_table_row">${getTableRow(label, params.name)}</div>`;
    }
    return '';
}

const getCurrentMetric = params => {
    if (_.get(params, 'data.datum.current.metrics')) {
        const metricAccessor = YAxisAccessor.getMetric();
        return `<div class="zd_tooltip_info_table_row">${getTableRow(`${_.get(metricAccessor, 'label')} (${_.get(metricAccessor, 'func')})`, YAxisAccessor.formatted(params.data.datum))}</div>`;
    }
    return '';
}

const getMetric = params => {
    if (_.get(params, 'data.datum.current.count')) {
        const metric = getCurrentMetric(params);
        return `<div class="zd_tooltip_info_table_row">${getTableRow('Volume', params.data.datum.current.count)}</div>${metric}`;l
    }
    return '';
}

/**
 * Format number to k, M, G (thousand, Million)
 * @param {Number} number 
 * @param {Number} digits 
 */
export const SIFormat = (number, digits=0) => {
    const codeTable = ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T'];
    const [exponentialNumber, exponential] = number.toExponential(digits).split('e+');
    const index = Math.floor(_.parseInt(exponential) / 3);
    return exponentialNumber * Math.pow(10, _.parseInt(exponential) - index * 3) + codeTable[index + 4];
}

export const getXAxisData = () => {
    return _.flow([getDataDomain, _.orderBy, mapDataDomain])();
}

export const getSeries = (data, xAxisArray) => {
    const series = [];
    data.map(datum => {
        const firstNameMultiGroupAccesor = _.first(datum.group);
        const secondNameMultiGroupAccesor = multiGroupAccessor.formatted(datum, 1);
        const seriesExists = _.find(series, { name: firstNameMultiGroupAccesor });
        const value = getMetricValue(datum);

        if (seriesExists) {
            const serieDataInstance = _.find(seriesExists.data, { name: secondNameMultiGroupAccesor });
            if (serieDataInstance) {
                serieDataInstance.value = value;
                serieDataInstance.datum = datum;
            }
        } else {
            const color = controller.getColorAccessor().color(datum);
            series.push({ 
                        type: 'line', 
                        name: firstNameMultiGroupAccesor, 
                        itemStyle: { color }, 
                        data: xAxisArray.map(xAxisValue => ({ 
                            name: xAxisValue, 
                            value: secondNameMultiGroupAccesor === xAxisValue ? value : null,
                            datum: secondNameMultiGroupAccesor === xAxisValue ? datum : null,
                        })
                        ),
                        markLine: {
                            symbol: ['none', 'none'],
                            label: {
                                show: false,
                            },
                            lineStyle: {
                                type: 'dotted',
                                width: 2,
                                emphasis: {
                                    type: 'dotted',
                                    width: 2,
                                }
                            },
                            data: null,
                            animation: true,
                            silent: true,
                        },
            });
        }
    });
    return series;
}

export const getMetricTooltip = params => {
    if (params && _.get(params, 'name') && _.get(params, 'color') && _.get(params, 'data.value')) {
        const firstAccessorMultiGroup = _.first(multiGroupAccessor._accessors);
        // Access value directly from datum, because params.name can be empty when mouse move
        const value = firstAccessorMultiGroup.formatted(params.data.datum);
        const color = `<div class="color_icon active" style="background-color: ${params.color};"></div>`;
        const trendAttributeTooltip = getTrendAttributeTooltip(params);
        const metricTooltip = getMetric(params);
        return `<div class="zd_tooltip_info_group customized"><div class="zd_tooltip_info_table"><div class="zd_tooltip_info_table_row">${getTableRow(firstAccessorMultiGroup.getLabel(), value, color)}</div>${trendAttributeTooltip}${metricTooltip}</div></div>`;
    }
    return '';
};
