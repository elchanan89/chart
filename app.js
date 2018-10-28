
var accessKey = window.prompt("Please insert your access Key (for: fixer API)");
 
// Api fixer - url
var baseUrl = "http://data.fixer.io/api/"; 

// Config - A global var,
// If you want to change the coins types(for example), You can do it easily
// By changing the config.chart(and once again in config.chart.labels)
// As well as :daysBack. 
var config = {
    daysBack: 7,
    data: [],
    chart: {
        USD: [],
        CAD: [],               
        GBP: [],
        labels: ["USD", "CAD", "GBP"]
    }
}

// Get dates to request data for them
var dates = getDates();
var promises = [];
for (var index = 0; index < dates.length; index++) {

    // Create promise
    var promise = getPastRates(dates[index]);

    promise.then(function (json) {

        // Success
        if (json.success) {

            config.data.push(json);
        }
        else {

            // Error
            alert(json.error.type + "\n" + json.error.info);
        }
    }), function (err) {

        // Error
        console.log(err);
    };

    promises.push(promise);
}

Promise.all(promises).then(function () {

    // Call and build the chart according to the data 
    loadChart();
})


// ----------------------------------------       Functions region 

function getPastRates(date) {

    var coins = config.chart.labels[0] + "," + config.chart.labels[1] + ',' + config.chart.labels[2];

    // *** There is a much easier way to do it, By using "timeseries" 
    // https://data.fixer.io/api/timeseries?access_key=API_KEY&start_date=&end_date=
    // But access restricted for unpaid users***

    // Url contain access key, curr date, 3 different tipes of coins
    var url = baseUrl + date + '?access_key=' + accessKey + '&symbols=' + coins;
    return $.ajax(url);
}

// Get specific dates 
// Return array that contain dates in a certain format
function getDates() {

    var arrDates = [];
    for (var index = 0; index <= config.daysBack; index++) {

        // get current date 
        var day = new Date(new Date().setDate(new Date().getDate() - index));

        // Convert to yyyy-mm-dd date format
        day = day.toISOString().substring(0, 10);
        arrDates.push(day);
    }

    return arrDates;
}

// ------------------------------------- Storage region

// By any change - drag or resize, save the new design
function saveChartCSS(design, event) {
	
	// Check if the browser support..
	if (typeof(Storage) !== "undefined") {
		if (event === "drag") {
			localStorage.setItem('chartPosition', JSON.stringify(design));
		} else if (event === "resize") {
			localStorage.setItem('chartWidthAndHeight', JSON.stringify(design));
		}
	}
}

// Get chart css(position & size) from localStorage 
function loadChartCSS() {
	
	// Check if the browser support..
	if (typeof(Storage) !== "undefined") {
		var wrapper = $("#wrapper");

		// Chart position
		if (localStorage.getItem("chartPosition")) {
			chartPosition = JSON.parse(localStorage.getItem("chartPosition"));
			wrapper.css(chartPosition);
		}

		// Chart width height
		if (localStorage.getItem("chartWidthAndHeight")) {
			chartWidthAndHeight = JSON.parse(localStorage.getItem("chartWidthAndHeight"));
			wrapper.css(chartWidthAndHeight);
			$("#chart").css(chartWidthAndHeight);
		}
	}
}

// -------------------------------------------  Chart region

function loadChart() {

    for (var i = 0; i < config.data.length; i++) {

        config.chart[config.chart.labels[0]].push(config.data[i].rates[config.chart.labels[0]]);
        config.chart[config.chart.labels[1]].push(config.data[i].rates[config.chart.labels[1]]);
        config.chart[config.chart.labels[2]].push(config.data[i].rates[config.chart.labels[2]]);
    }

    var chartConfig = {
        type: 'line',
        data: {
            labels: dates.sort(),
            datasets: [{
                label: config.chart.labels[0],
                fill: false,
                backgroundColor: 'blue',
                borderColor: 'blue',
                data: config.chart[config.chart.labels[0]]
            }, {
                label: config.chart.labels[1],
                fill: false,
                backgroundColor: 'green',
                borderColor: 'green',
                data: config.chart[config.chart.labels[1]]
            }, {
                label: config.chart.labels[2],
                fill: false,
                backgroundColor: 'red',
                borderColor: 'red',
                data: config.chart[config.chart.labels[2]]

            }]
        },
        options: {
            responsive: false,
            title: {
                display: true,
                text: 'COMPARED TO EUR'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'day'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            }
        }
    };

    var ctx = document.getElementById('chart').getContext('2d');
    window.myLine = new Chart(ctx, chartConfig);

    // Loading chart design from a local storage(if exist) 
    loadChartCSS();
    $("#wrapper").css("visibility", "visible");
    $("#loading-bar").css("display", "none");

    // ---------- Jquery draggable widget
    $("#wrapper").draggable({
        cursor: "move",
        drag: function (event, ui) {

            // Save new position 
            saveChartCSS(ui.position, "drag");
        }
    });

    // ---------- Jquery resizable widget                               
    $("#wrapper").resizable({
        resize: function (event, ui) {

            // Save new size
            saveChartCSS(ui.size, "resize");
        },
        handles: "n, e, s, w",
        alsoResize: "#chart"
    });
}
