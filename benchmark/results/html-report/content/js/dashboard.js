/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.97740793734468, "KoPercent": 0.02259206265532043};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9566608931395436, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.9618451025056948, 500, 1500, "GET /api/listings?page=0&size=10"], "isController": false}, {"data": [0.9708846584546472, 500, 1500, "GET /api/search?keyword=tai nghe"], "isController": false}, {"data": [0.9675785207700102, 500, 1500, "GET /api/categories"], "isController": false}, {"data": [0.9424052774018945, 500, 1500, "GET /api/listings (stress)"], "isController": false}, {"data": [0.972972972972973, 500, 1500, "GET /actuator/health"], "isController": false}, {"data": [0.9703903095558546, 500, 1500, "GET /api/community/posts"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 13279, 3, 0.02259206265532043, 338.8963777392866, 90, 10027, 112.0, 179.0, 286.0, 5120.0, 200.43471041946538, 1309.3772582206304, 34.45630478690887], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET /api/listings?page=0&size=10", 1756, 0, 0.0, 310.91685649202714, 96, 5172, 117.0, 152.0, 176.29999999999973, 5114.43, 50.3888203391776, 441.11316075246066, 8.758994160521107], "isController": false}, {"data": ["GET /api/search?keyword=tai nghe", 893, 0, 0.0, 336.917133258678, 122, 5313, 187.0, 276.0, 316.29999999999995, 5162.12, 26.09813835228103, 268.46918084395185, 4.969860330756641], "isController": false}, {"data": ["GET /api/categories", 1974, 0, 0.0, 269.30648429584573, 92, 5142, 106.0, 126.0, 143.0, 5105.25, 56.47907069897857, 138.27444359603444, 9.100631509112757], "isController": false}, {"data": ["GET /api/listings (stress)", 5912, 2, 0.03382949932341001, 403.3497970230041, 94, 10027, 111.0, 147.0, 5096.0, 5121.0, 89.23638888469608, 780.9782175457728, 15.506546599296612], "isController": false}, {"data": ["GET /actuator/health", 1258, 0, 0.0, 237.84022257551666, 90, 5123, 101.0, 117.0, 135.0999999999999, 5099.41, 37.01306343415323, 17.85591146139814, 6.000164580145934], "isController": false}, {"data": ["GET /api/community/posts", 1486, 1, 0.06729475100942127, 294.71736204576024, 100, 10015, 139.0, 192.0, 219.64999999999986, 5126.13, 43.649394900716715, 147.12388517433322, 7.582386488808601], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com:80 [slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/54.251.111.107, slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/18.140.90.160] failed: Connect timed out", 3, 100.0, 0.02259206265532043], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 13279, 3, "Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com:80 [slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/54.251.111.107, slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/18.140.90.160] failed: Connect timed out", 3, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["GET /api/listings (stress)", 5912, 2, "Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com:80 [slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/54.251.111.107, slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/18.140.90.160] failed: Connect timed out", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["GET /api/community/posts", 1486, 1, "Non HTTP response code: org.apache.http.conn.ConnectTimeoutException/Non HTTP response message: Connect to slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com:80 [slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/54.251.111.107, slife-alb-1599859064.ap-southeast-1.elb.amazonaws.com/18.140.90.160] failed: Connect timed out", 1, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
