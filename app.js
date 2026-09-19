let marketData = null;
let chartInstance = null;
let allMonths = [];
let slider = null;

let currentStartMonthStr = null;
let currentEndMonthStr = null;

const irsLimits = {
    1993: 8994, 1994: 9240, 1995: 9240, 1996: 9500, 1997: 9500,
    1998: 10000, 1999: 10000, 2000: 10500, 2001: 10500, 2002: 11000,
    2003: 12000, 2004: 13000, 2005: 14000, 2006: 15000, 2007: 15500,
    2008: 15500, 2009: 16500, 2010: 16500, 2011: 16500, 2012: 17000,
    2013: 17500, 2014: 17500, 2015: 18000, 2016: 18000, 2017: 18000,
    2018: 18500, 2019: 19000, 2020: 19500, 2021: 19500, 2022: 20500,
    2023: 22500, 2024: 23000, 2025: 23500, 2026: 24000
};

const catchupLimits = {
    2002: 1000, 2003: 2000, 2004: 3000, 2005: 4000, 2006: 5000,
    2007: 5000, 2008: 5000, 2009: 5500, 2010: 5500, 2011: 5500,
    2012: 5500, 2013: 5500, 2014: 5500, 2015: 6000, 2016: 6000,
    2017: 6000, 2018: 6000, 2019: 6000, 2020: 6500, 2021: 6500,
    2022: 6500, 2023: 7500, 2024: 7500, 2025: 7500, 2026: 7500
};

const indexSelect = document.getElementById('index-select');
const modeSelect = document.getElementById('contrib-mode');
const customAmtInput = document.getElementById('custom-amount');
const customAmtGroup = document.getElementById('custom-amount-group');
const turn50YearInput = document.getElementById('turn-50-year');
const catchupRadios = document.getElementsByName('catchup');
const rangeLabel = document.getElementById('range-label');
const sliderElement = document.getElementById('date-slider');

modeSelect.addEventListener('change', (e) => {
    customAmtGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    runSimulation();
});
customAmtInput.addEventListener('input', runSimulation);

const catchupGroup = document.getElementById('catchup-group');

function updateCatchupState() {
    if (turn50YearInput.value === '') {
        catchupGroup.classList.add('disabled');
        document.getElementById('catchup-no').checked = true;
    } else {
        catchupGroup.classList.remove('disabled');
    }
}

turn50YearInput.addEventListener('input', (e) => {
    if (!e.target.dataset.touched && e.target.value !== '') {
        e.target.value = '2020';
    }
    e.target.dataset.touched = 'true';
    
    if (e.target.value !== '') {
        document.getElementById('catchup-yes').checked = true;
    }
    if (e.target.value === '') {
        e.target.dataset.touched = '';
    }
    updateCatchupState();
    runSimulation();
});

catchupRadios.forEach(radio => radio.addEventListener('change', runSimulation));
indexSelect.addEventListener('change', () => {
    updateSlidersForIndex();
    runSimulation();
});

function initSlider() {
    noUiSlider.create(sliderElement, {
        start: [0, 100],
        connect: true,
        step: 1,
        range: { 'min': 0, 'max': 100 }
    });

    sliderElement.noUiSlider.on('slide', function (values) {
        updateRangeLabel(values);
        runSimulation();
    });
    
    sliderElement.noUiSlider.on('update', function (values) {
        updateRangeLabel(values);
    });
}

let isProgrammatic = false;

function updateSlidersForIndex() {
    if (!marketData) return;
    const index = indexSelect.value;
    allMonths = Object.keys(marketData[index]).sort();
    
    const maxVal = allMonths.length - 1;
    
    isProgrammatic = true;
    sliderElement.noUiSlider.updateOptions({
        range: { 'min': 0, 'max': maxVal }
    });

    let newStartVal = 0;
    let newEndVal = maxVal;

    if (currentStartMonthStr && currentEndMonthStr) {
        let foundStart = allMonths.indexOf(currentStartMonthStr);
        let foundEnd = allMonths.indexOf(currentEndMonthStr);
        
        if (foundStart === -1) {
            foundStart = allMonths.findIndex(m => m >= currentStartMonthStr);
            if (foundStart === -1) foundStart = maxVal;
        }
        if (foundEnd === -1) {
            foundEnd = 0;
            for(let i = allMonths.length - 1; i >= 0; i--) {
                if (allMonths[i] <= currentEndMonthStr) {
                    foundEnd = i;
                    break;
                }
            }
        }

        if (foundStart <= foundEnd) {
            newStartVal = foundStart;
            newEndVal = foundEnd;
        } else {
            newStartVal = 0;
            newEndVal = maxVal;
        }
    }

    sliderElement.noUiSlider.set([newStartVal, newEndVal]);
    updateRangeLabel([newStartVal, newEndVal]);
    isProgrammatic = false;
}

function updateRangeLabel(values) {
    if (allMonths.length === 0) return;
    const startIdx = Math.round(values[0]);
    const endIdx = Math.round(values[1]);
    const startMonth = allMonths[startIdx];
    const endMonth = allMonths[endIdx];
    
    if (!isProgrammatic) {
        currentStartMonthStr = startMonth;
        currentEndMonthStr = endMonth;
    }
    
    rangeLabel.innerText = `${startMonth}  to  ${endMonth}`;
}

async function loadData() {
    initSlider();
    const res = await fetch('data.json');
    marketData = await res.json();
    updateSlidersForIndex();
    updateCatchupState();
    runSimulation();
}

function runSimulation() {
    if (!marketData || allMonths.length === 0) return;

    const index = indexSelect.value;
    const values = sliderElement.noUiSlider.get();
    const startVal = Math.round(values[0]);
    const endVal = Math.round(values[1]);
    const mode = modeSelect.value;
    const customAmt = parseFloat(customAmtInput.value) || 0;
    const turn50Year = parseInt(turn50YearInput.value) || 2100;
    const catchupEnable = document.getElementById('catchup-yes').checked;

    const priceHistory = marketData[index];
    
    const startMonthStr = allMonths[startVal];
    const endMonthStr = allMonths[endVal];
    const startYear = parseInt(startMonthStr.split('-')[0]);
    const endYear = parseInt(endMonthStr.split('-')[0]);

    const activeKeys = Object.keys(priceHistory).sort().filter(m => m >= startMonthStr && m <= endMonthStr);
    let totalShares = 0;
    let totalContrib = 0;
    
    const yearlySums = {};
    const monthlyContribsHistory = [];
    const rawBalanceData = [];

    for (let i = 0; i < activeKeys.length; i++) {
        const m = activeKeys[i];
        const year = parseInt(m.split('-')[0]);
        
        let monthlyContrib = 0;
        if (mode === 'irs') {
            const limit = irsLimits[year] || irsLimits[2026];
            let catchup = 0;
            if (catchupEnable && year >= turn50Year && year >= 2002) {
                catchup = catchupLimits[year] || catchupLimits[2026];
            }
            monthlyContrib = (limit + catchup) / 12;
        } else {
            monthlyContrib = customAmt;
        }

        monthlyContribsHistory.push(monthlyContrib);

        const price = priceHistory[m];
        const sharesBought = monthlyContrib / price;
        
        totalShares += sharesBought;
        totalContrib += monthlyContrib;
        const currentBalance = totalShares * price;

        rawBalanceData.push({ m, currentBalance, totalContrib });

        if (!yearlySums[year]) {
            yearlySums[year] = 0;
        }
        yearlySums[year] += monthlyContrib;
    }

    const labels = Object.keys(yearlySums).sort();
    
    // Convert bar data to explicit {x, y} coordinates for the linear axis
    const annualContribData = labels.map((yr, index) => ({
        x: index,
        y: yearlySums[yr]
    }));

    const balanceData = [];
    
    for (let i = 0; i < rawBalanceData.length; i++) {
        const item = rawBalanceData[i];
        let xPos = 0;
        if (activeKeys.length > 1 && labels.length > 1) {
            xPos = i * (labels.length - 1) / (activeKeys.length - 1);
        }
        balanceData.push({ x: xPos, y: item.currentBalance, month: item.m, cumContrib: item.totalContrib });
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    document.getElementById('total-contrib-display').innerText = formatter.format(totalContrib);
    
    // Find last valid balance to display
    const lastValidBalance = balanceData.length > 0 ? balanceData[balanceData.length - 1].y : 0;
    document.getElementById('final-balance-display').innerText = formatter.format(lastValidBalance);

    // Calculate Annualized Return (IRR)
    let annualizedReturn = 0;
    if (lastValidBalance > 0 && totalContrib > 0) {
        let low = -0.99;
        let high = 1.0;
        let r = 0;
        for (let i = 0; i < 50; i++) {
            r = (low + high) / 2;
            let futureValue = 0;
            for (let j = 0; j < monthlyContribsHistory.length; j++) {
                futureValue += monthlyContribsHistory[j] * Math.pow(1 + r, monthlyContribsHistory.length - 1 - j);
            }
            if (futureValue < lastValidBalance) {
                low = r;
            } else {
                high = r;
            }
        }
        annualizedReturn = (Math.pow(1 + r, 12) - 1) * 100;
    }
    document.getElementById('annualized-return-display').innerText = annualizedReturn.toFixed(2) + '%';

    renderChart(labels, balanceData, annualContribData);
}

function renderChart(labels, balanceData, annualContribData, cumulativeContribData) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Dynamic Y1 Scale
    let maxAnnualContrib = 0;
    if (annualContribData.length > 0) {
        maxAnnualContrib = Math.max(...annualContribData.map(d => d.y)) || 0;
    }
    let desiredMax = maxAnnualContrib * 2.5;
    let roundedMax = Math.ceil(desiredMax / 10000) * 10000;
    const y1Max = Math.max(10000, roundedMax);

    // Dynamic Bar Width

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#334155';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Total Balance ($)',
                    data: balanceData,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2, // Thinner line
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 0,
                    pointHoverBackgroundColor: '#f8fafc', // Pure white dot
                    pointStyle: 'circle',
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Annual Contribution ($)',
                    data: annualContribData,
                    backgroundColor: '#facc15', // Yellow bars
                    barPercentage: 0.618,
                    categoryPercentage: 1.0,
                    yAxisID: 'y1', // Bind to right axis
                    pointStyle: 'rectRounded',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: labels.length > 1 ? labels.length - 1 : 0,
                    offset: true,
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value) && labels[value]) {
                                return labels[value];
                            }
                            return '';
                        },
                        autoSkip: true,
                        maxTicksLimit: 20,
                        minRotation: 45,
                        maxRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Total Balance ($)'
                    },
                    grid: { drawBorder: false },
                    ticks: {
                        callback: function(value) {
                            if(value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M';
                            if(value >= 1000) return '$' + (value/1000).toFixed(0) + 'k';
                            return '$' + value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Annual Contribution ($)'
                    },
                    max: y1Max,
                    grid: { drawOnChartArea: false },
                    ticks: {
                        callback: function(value) {
                            if(value >= 1000) return '$' + (value/1000).toFixed(0) + 'k';
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        boxWidth: 15,
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            original.forEach(label => {
                                if (label.text.includes('Balance')) {
                                    label.pointStyle = 'line';
                                    label.lineWidth = 3;
                                }
                            });
                            return original;
                        }
                    }
                },
                tooltip: {
                    caretPadding: 15, // Push tooltip away from the dot
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            if (context[0].dataset.type === 'line') {
                                return context[0].raw.month;
                            } else {
                                const xIndex = context[0].parsed.x;
                                return labels[xIndex] || context[0].label;
                            }
                        },
                        label: function(context) {
                            const val = context.parsed.y;
                            if (val === null || isNaN(val) || val === 0) return null;
                            const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
                            
                            if (context.dataset.type === 'line') {
                                const cumContrib = context.raw.cumContrib;
                                return [
                                    `Total Balance: ${formatter.format(val)}`,
                                    `Cumulative Contribution: ${formatter.format(cumContrib)}`
                                ];
                            } else {
                                return `Yearly Contribution: ${formatter.format(val)}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', loadData);
