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
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 93.0, "minX": 0.0, "maxY": 5353.0, "series": [{"data": [[0.0, 93.0], [0.1, 93.0], [0.2, 93.0], [0.3, 93.0], [0.4, 94.0], [0.5, 94.0], [0.6, 94.0], [0.7, 94.0], [0.8, 94.0], [0.9, 94.0], [1.0, 94.0], [1.1, 94.0], [1.2, 94.0], [1.3, 94.0], [1.4, 94.0], [1.5, 94.0], [1.6, 94.0], [1.7, 94.0], [1.8, 94.0], [1.9, 94.0], [2.0, 94.0], [2.1, 94.0], [2.2, 94.0], [2.3, 94.0], [2.4, 94.0], [2.5, 94.0], [2.6, 94.0], [2.7, 94.0], [2.8, 94.0], [2.9, 94.0], [3.0, 94.0], [3.1, 95.0], [3.2, 95.0], [3.3, 95.0], [3.4, 95.0], [3.5, 95.0], [3.6, 95.0], [3.7, 95.0], [3.8, 95.0], [3.9, 95.0], [4.0, 95.0], [4.1, 95.0], [4.2, 95.0], [4.3, 95.0], [4.4, 95.0], [4.5, 95.0], [4.6, 95.0], [4.7, 95.0], [4.8, 95.0], [4.9, 95.0], [5.0, 95.0], [5.1, 95.0], [5.2, 95.0], [5.3, 95.0], [5.4, 95.0], [5.5, 95.0], [5.6, 95.0], [5.7, 95.0], [5.8, 95.0], [5.9, 95.0], [6.0, 95.0], [6.1, 95.0], [6.2, 95.0], [6.3, 95.0], [6.4, 95.0], [6.5, 95.0], [6.6, 95.0], [6.7, 95.0], [6.8, 95.0], [6.9, 95.0], [7.0, 95.0], [7.1, 95.0], [7.2, 95.0], [7.3, 95.0], [7.4, 95.0], [7.5, 95.0], [7.6, 95.0], [7.7, 95.0], [7.8, 95.0], [7.9, 95.0], [8.0, 95.0], [8.1, 95.0], [8.2, 95.0], [8.3, 95.0], [8.4, 95.0], [8.5, 95.0], [8.6, 95.0], [8.7, 95.0], [8.8, 95.0], [8.9, 95.0], [9.0, 95.0], [9.1, 95.0], [9.2, 95.0], [9.3, 96.0], [9.4, 96.0], [9.5, 96.0], [9.6, 96.0], [9.7, 96.0], [9.8, 96.0], [9.9, 96.0], [10.0, 96.0], [10.1, 96.0], [10.2, 96.0], [10.3, 96.0], [10.4, 96.0], [10.5, 96.0], [10.6, 96.0], [10.7, 96.0], [10.8, 96.0], [10.9, 96.0], [11.0, 96.0], [11.1, 96.0], [11.2, 96.0], [11.3, 96.0], [11.4, 96.0], [11.5, 96.0], [11.6, 96.0], [11.7, 96.0], [11.8, 96.0], [11.9, 96.0], [12.0, 96.0], [12.1, 96.0], [12.2, 96.0], [12.3, 96.0], [12.4, 96.0], [12.5, 96.0], [12.6, 96.0], [12.7, 96.0], [12.8, 96.0], [12.9, 96.0], [13.0, 96.0], [13.1, 96.0], [13.2, 96.0], [13.3, 96.0], [13.4, 96.0], [13.5, 96.0], [13.6, 96.0], [13.7, 96.0], [13.8, 96.0], [13.9, 96.0], [14.0, 96.0], [14.1, 96.0], [14.2, 96.0], [14.3, 96.0], [14.4, 96.0], [14.5, 96.0], [14.6, 96.0], [14.7, 96.0], [14.8, 96.0], [14.9, 96.0], [15.0, 96.0], [15.1, 96.0], [15.2, 96.0], [15.3, 96.0], [15.4, 96.0], [15.5, 96.0], [15.6, 96.0], [15.7, 96.0], [15.8, 96.0], [15.9, 96.0], [16.0, 96.0], [16.1, 96.0], [16.2, 96.0], [16.3, 96.0], [16.4, 96.0], [16.5, 96.0], [16.6, 96.0], [16.7, 96.0], [16.8, 96.0], [16.9, 96.0], [17.0, 96.0], [17.1, 96.0], [17.2, 96.0], [17.3, 96.0], [17.4, 96.0], [17.5, 96.0], [17.6, 96.0], [17.7, 96.0], [17.8, 96.0], [17.9, 97.0], [18.0, 97.0], [18.1, 97.0], [18.2, 97.0], [18.3, 97.0], [18.4, 97.0], [18.5, 97.0], [18.6, 97.0], [18.7, 97.0], [18.8, 97.0], [18.9, 97.0], [19.0, 97.0], [19.1, 97.0], [19.2, 97.0], [19.3, 97.0], [19.4, 97.0], [19.5, 97.0], [19.6, 97.0], [19.7, 97.0], [19.8, 97.0], [19.9, 97.0], [20.0, 97.0], [20.1, 97.0], [20.2, 97.0], [20.3, 97.0], [20.4, 97.0], [20.5, 97.0], [20.6, 97.0], [20.7, 97.0], [20.8, 97.0], [20.9, 97.0], [21.0, 97.0], [21.1, 97.0], [21.2, 97.0], [21.3, 97.0], [21.4, 97.0], [21.5, 97.0], [21.6, 97.0], [21.7, 97.0], [21.8, 97.0], [21.9, 97.0], [22.0, 97.0], [22.1, 97.0], [22.2, 97.0], [22.3, 97.0], [22.4, 97.0], [22.5, 97.0], [22.6, 97.0], [22.7, 97.0], [22.8, 97.0], [22.9, 97.0], [23.0, 97.0], [23.1, 97.0], [23.2, 97.0], [23.3, 97.0], [23.4, 97.0], [23.5, 97.0], [23.6, 97.0], [23.7, 97.0], [23.8, 97.0], [23.9, 97.0], [24.0, 97.0], [24.1, 97.0], [24.2, 97.0], [24.3, 97.0], [24.4, 97.0], [24.5, 97.0], [24.6, 98.0], [24.7, 98.0], [24.8, 98.0], [24.9, 98.0], [25.0, 98.0], [25.1, 98.0], [25.2, 98.0], [25.3, 98.0], [25.4, 98.0], [25.5, 98.0], [25.6, 98.0], [25.7, 98.0], [25.8, 98.0], [25.9, 98.0], [26.0, 98.0], [26.1, 98.0], [26.2, 98.0], [26.3, 98.0], [26.4, 98.0], [26.5, 98.0], [26.6, 98.0], [26.7, 98.0], [26.8, 98.0], [26.9, 98.0], [27.0, 98.0], [27.1, 98.0], [27.2, 98.0], [27.3, 98.0], [27.4, 98.0], [27.5, 98.0], [27.6, 98.0], [27.7, 98.0], [27.8, 98.0], [27.9, 99.0], [28.0, 99.0], [28.1, 99.0], [28.2, 99.0], [28.3, 99.0], [28.4, 99.0], [28.5, 99.0], [28.6, 99.0], [28.7, 99.0], [28.8, 99.0], [28.9, 99.0], [29.0, 99.0], [29.1, 99.0], [29.2, 99.0], [29.3, 99.0], [29.4, 100.0], [29.5, 100.0], [29.6, 100.0], [29.7, 100.0], [29.8, 100.0], [29.9, 100.0], [30.0, 100.0], [30.1, 100.0], [30.2, 100.0], [30.3, 100.0], [30.4, 100.0], [30.5, 100.0], [30.6, 100.0], [30.7, 100.0], [30.8, 101.0], [30.9, 101.0], [31.0, 101.0], [31.1, 101.0], [31.2, 101.0], [31.3, 101.0], [31.4, 101.0], [31.5, 101.0], [31.6, 101.0], [31.7, 101.0], [31.8, 101.0], [31.9, 101.0], [32.0, 101.0], [32.1, 101.0], [32.2, 101.0], [32.3, 101.0], [32.4, 101.0], [32.5, 101.0], [32.6, 101.0], [32.7, 101.0], [32.8, 101.0], [32.9, 101.0], [33.0, 101.0], [33.1, 101.0], [33.2, 101.0], [33.3, 101.0], [33.4, 101.0], [33.5, 101.0], [33.6, 101.0], [33.7, 101.0], [33.8, 101.0], [33.9, 101.0], [34.0, 101.0], [34.1, 101.0], [34.2, 101.0], [34.3, 101.0], [34.4, 101.0], [34.5, 101.0], [34.6, 102.0], [34.7, 102.0], [34.8, 102.0], [34.9, 102.0], [35.0, 102.0], [35.1, 102.0], [35.2, 102.0], [35.3, 102.0], [35.4, 102.0], [35.5, 102.0], [35.6, 102.0], [35.7, 102.0], [35.8, 102.0], [35.9, 102.0], [36.0, 102.0], [36.1, 102.0], [36.2, 102.0], [36.3, 102.0], [36.4, 102.0], [36.5, 102.0], [36.6, 102.0], [36.7, 102.0], [36.8, 102.0], [36.9, 102.0], [37.0, 102.0], [37.1, 102.0], [37.2, 102.0], [37.3, 102.0], [37.4, 102.0], [37.5, 102.0], [37.6, 102.0], [37.7, 102.0], [37.8, 102.0], [37.9, 102.0], [38.0, 102.0], [38.1, 102.0], [38.2, 102.0], [38.3, 102.0], [38.4, 102.0], [38.5, 102.0], [38.6, 102.0], [38.7, 102.0], [38.8, 102.0], [38.9, 102.0], [39.0, 102.0], [39.1, 102.0], [39.2, 102.0], [39.3, 102.0], [39.4, 102.0], [39.5, 102.0], [39.6, 102.0], [39.7, 102.0], [39.8, 102.0], [39.9, 102.0], [40.0, 102.0], [40.1, 102.0], [40.2, 102.0], [40.3, 102.0], [40.4, 102.0], [40.5, 102.0], [40.6, 102.0], [40.7, 102.0], [40.8, 102.0], [40.9, 102.0], [41.0, 102.0], [41.1, 102.0], [41.2, 102.0], [41.3, 102.0], [41.4, 102.0], [41.5, 102.0], [41.6, 102.0], [41.7, 102.0], [41.8, 102.0], [41.9, 102.0], [42.0, 102.0], [42.1, 102.0], [42.2, 102.0], [42.3, 103.0], [42.4, 103.0], [42.5, 103.0], [42.6, 103.0], [42.7, 103.0], [42.8, 103.0], [42.9, 103.0], [43.0, 103.0], [43.1, 103.0], [43.2, 103.0], [43.3, 103.0], [43.4, 103.0], [43.5, 103.0], [43.6, 103.0], [43.7, 103.0], [43.8, 103.0], [43.9, 103.0], [44.0, 103.0], [44.1, 103.0], [44.2, 103.0], [44.3, 103.0], [44.4, 103.0], [44.5, 103.0], [44.6, 103.0], [44.7, 103.0], [44.8, 103.0], [44.9, 103.0], [45.0, 103.0], [45.1, 103.0], [45.2, 103.0], [45.3, 103.0], [45.4, 103.0], [45.5, 103.0], [45.6, 103.0], [45.7, 103.0], [45.8, 103.0], [45.9, 103.0], [46.0, 103.0], [46.1, 103.0], [46.2, 103.0], [46.3, 103.0], [46.4, 103.0], [46.5, 103.0], [46.6, 103.0], [46.7, 103.0], [46.8, 103.0], [46.9, 103.0], [47.0, 103.0], [47.1, 103.0], [47.2, 103.0], [47.3, 103.0], [47.4, 103.0], [47.5, 103.0], [47.6, 103.0], [47.7, 103.0], [47.8, 103.0], [47.9, 103.0], [48.0, 103.0], [48.1, 103.0], [48.2, 103.0], [48.3, 103.0], [48.4, 103.0], [48.5, 103.0], [48.6, 103.0], [48.7, 103.0], [48.8, 103.0], [48.9, 103.0], [49.0, 103.0], [49.1, 103.0], [49.2, 103.0], [49.3, 103.0], [49.4, 103.0], [49.5, 103.0], [49.6, 103.0], [49.7, 103.0], [49.8, 103.0], [49.9, 103.0], [50.0, 104.0], [50.1, 104.0], [50.2, 104.0], [50.3, 104.0], [50.4, 104.0], [50.5, 104.0], [50.6, 104.0], [50.7, 104.0], [50.8, 104.0], [50.9, 104.0], [51.0, 104.0], [51.1, 104.0], [51.2, 104.0], [51.3, 104.0], [51.4, 104.0], [51.5, 104.0], [51.6, 104.0], [51.7, 104.0], [51.8, 104.0], [51.9, 104.0], [52.0, 104.0], [52.1, 104.0], [52.2, 104.0], [52.3, 104.0], [52.4, 104.0], [52.5, 104.0], [52.6, 104.0], [52.7, 104.0], [52.8, 104.0], [52.9, 104.0], [53.0, 104.0], [53.1, 104.0], [53.2, 104.0], [53.3, 104.0], [53.4, 104.0], [53.5, 104.0], [53.6, 104.0], [53.7, 104.0], [53.8, 104.0], [53.9, 104.0], [54.0, 104.0], [54.1, 104.0], [54.2, 104.0], [54.3, 104.0], [54.4, 104.0], [54.5, 104.0], [54.6, 104.0], [54.7, 104.0], [54.8, 104.0], [54.9, 104.0], [55.0, 104.0], [55.1, 104.0], [55.2, 104.0], [55.3, 104.0], [55.4, 104.0], [55.5, 104.0], [55.6, 104.0], [55.7, 104.0], [55.8, 105.0], [55.9, 105.0], [56.0, 105.0], [56.1, 105.0], [56.2, 105.0], [56.3, 105.0], [56.4, 105.0], [56.5, 105.0], [56.6, 105.0], [56.7, 105.0], [56.8, 105.0], [56.9, 105.0], [57.0, 105.0], [57.1, 105.0], [57.2, 105.0], [57.3, 105.0], [57.4, 105.0], [57.5, 105.0], [57.6, 105.0], [57.7, 105.0], [57.8, 105.0], [57.9, 105.0], [58.0, 105.0], [58.1, 105.0], [58.2, 105.0], [58.3, 105.0], [58.4, 105.0], [58.5, 105.0], [58.6, 105.0], [58.7, 105.0], [58.8, 106.0], [58.9, 106.0], [59.0, 106.0], [59.1, 106.0], [59.2, 106.0], [59.3, 106.0], [59.4, 106.0], [59.5, 106.0], [59.6, 106.0], [59.7, 106.0], [59.8, 106.0], [59.9, 106.0], [60.0, 106.0], [60.1, 107.0], [60.2, 107.0], [60.3, 107.0], [60.4, 107.0], [60.5, 107.0], [60.6, 107.0], [60.7, 107.0], [60.8, 107.0], [60.9, 107.0], [61.0, 107.0], [61.1, 107.0], [61.2, 107.0], [61.3, 107.0], [61.4, 108.0], [61.5, 108.0], [61.6, 108.0], [61.7, 108.0], [61.8, 108.0], [61.9, 108.0], [62.0, 108.0], [62.1, 108.0], [62.2, 108.0], [62.3, 108.0], [62.4, 108.0], [62.5, 108.0], [62.6, 108.0], [62.7, 108.0], [62.8, 108.0], [62.9, 108.0], [63.0, 108.0], [63.1, 108.0], [63.2, 108.0], [63.3, 108.0], [63.4, 108.0], [63.5, 108.0], [63.6, 108.0], [63.7, 108.0], [63.8, 108.0], [63.9, 108.0], [64.0, 108.0], [64.1, 108.0], [64.2, 108.0], [64.3, 108.0], [64.4, 108.0], [64.5, 108.0], [64.6, 108.0], [64.7, 108.0], [64.8, 109.0], [64.9, 109.0], [65.0, 109.0], [65.1, 109.0], [65.2, 109.0], [65.3, 109.0], [65.4, 109.0], [65.5, 109.0], [65.6, 109.0], [65.7, 109.0], [65.8, 109.0], [65.9, 109.0], [66.0, 109.0], [66.1, 109.0], [66.2, 109.0], [66.3, 109.0], [66.4, 109.0], [66.5, 109.0], [66.6, 109.0], [66.7, 109.0], [66.8, 109.0], [66.9, 109.0], [67.0, 109.0], [67.1, 109.0], [67.2, 109.0], [67.3, 109.0], [67.4, 109.0], [67.5, 109.0], [67.6, 109.0], [67.7, 109.0], [67.8, 109.0], [67.9, 109.0], [68.0, 109.0], [68.1, 109.0], [68.2, 109.0], [68.3, 109.0], [68.4, 109.0], [68.5, 109.0], [68.6, 109.0], [68.7, 109.0], [68.8, 109.0], [68.9, 109.0], [69.0, 109.0], [69.1, 109.0], [69.2, 109.0], [69.3, 109.0], [69.4, 109.0], [69.5, 109.0], [69.6, 109.0], [69.7, 109.0], [69.8, 109.0], [69.9, 109.0], [70.0, 109.0], [70.1, 109.0], [70.2, 109.0], [70.3, 109.0], [70.4, 109.0], [70.5, 109.0], [70.6, 109.0], [70.7, 109.0], [70.8, 109.0], [70.9, 109.0], [71.0, 109.0], [71.1, 109.0], [71.2, 109.0], [71.3, 109.0], [71.4, 109.0], [71.5, 109.0], [71.6, 109.0], [71.7, 109.0], [71.8, 109.0], [71.9, 110.0], [72.0, 110.0], [72.1, 110.0], [72.2, 110.0], [72.3, 110.0], [72.4, 110.0], [72.5, 110.0], [72.6, 110.0], [72.7, 110.0], [72.8, 110.0], [72.9, 110.0], [73.0, 110.0], [73.1, 110.0], [73.2, 110.0], [73.3, 110.0], [73.4, 110.0], [73.5, 110.0], [73.6, 110.0], [73.7, 110.0], [73.8, 110.0], [73.9, 110.0], [74.0, 110.0], [74.1, 110.0], [74.2, 110.0], [74.3, 110.0], [74.4, 110.0], [74.5, 110.0], [74.6, 110.0], [74.7, 110.0], [74.8, 110.0], [74.9, 110.0], [75.0, 110.0], [75.1, 110.0], [75.2, 110.0], [75.3, 110.0], [75.4, 110.0], [75.5, 110.0], [75.6, 110.0], [75.7, 110.0], [75.8, 110.0], [75.9, 110.0], [76.0, 110.0], [76.1, 110.0], [76.2, 110.0], [76.3, 110.0], [76.4, 110.0], [76.5, 110.0], [76.6, 110.0], [76.7, 110.0], [76.8, 110.0], [76.9, 110.0], [77.0, 110.0], [77.1, 110.0], [77.2, 110.0], [77.3, 110.0], [77.4, 110.0], [77.5, 110.0], [77.6, 110.0], [77.7, 110.0], [77.8, 110.0], [77.9, 110.0], [78.0, 110.0], [78.1, 110.0], [78.2, 110.0], [78.3, 110.0], [78.4, 110.0], [78.5, 110.0], [78.6, 110.0], [78.7, 110.0], [78.8, 110.0], [78.9, 110.0], [79.0, 110.0], [79.1, 110.0], [79.2, 110.0], [79.3, 110.0], [79.4, 110.0], [79.5, 110.0], [79.6, 110.0], [79.7, 110.0], [79.8, 110.0], [79.9, 111.0], [80.0, 111.0], [80.1, 111.0], [80.2, 111.0], [80.3, 111.0], [80.4, 111.0], [80.5, 111.0], [80.6, 111.0], [80.7, 111.0], [80.8, 111.0], [80.9, 111.0], [81.0, 111.0], [81.1, 111.0], [81.2, 111.0], [81.3, 111.0], [81.4, 111.0], [81.5, 111.0], [81.6, 111.0], [81.7, 111.0], [81.8, 111.0], [81.9, 111.0], [82.0, 111.0], [82.1, 111.0], [82.2, 111.0], [82.3, 111.0], [82.4, 111.0], [82.5, 111.0], [82.6, 111.0], [82.7, 111.0], [82.8, 111.0], [82.9, 111.0], [83.0, 111.0], [83.1, 111.0], [83.2, 111.0], [83.3, 111.0], [83.4, 111.0], [83.5, 111.0], [83.6, 111.0], [83.7, 111.0], [83.8, 111.0], [83.9, 111.0], [84.0, 111.0], [84.1, 111.0], [84.2, 111.0], [84.3, 111.0], [84.4, 111.0], [84.5, 111.0], [84.6, 111.0], [84.7, 111.0], [84.8, 111.0], [84.9, 111.0], [85.0, 111.0], [85.1, 111.0], [85.2, 111.0], [85.3, 111.0], [85.4, 111.0], [85.5, 111.0], [85.6, 111.0], [85.7, 111.0], [85.8, 111.0], [85.9, 112.0], [86.0, 112.0], [86.1, 112.0], [86.2, 112.0], [86.3, 112.0], [86.4, 112.0], [86.5, 112.0], [86.6, 112.0], [86.7, 112.0], [86.8, 112.0], [86.9, 112.0], [87.0, 112.0], [87.1, 112.0], [87.2, 112.0], [87.3, 112.0], [87.4, 112.0], [87.5, 112.0], [87.6, 112.0], [87.7, 112.0], [87.8, 112.0], [87.9, 112.0], [88.0, 112.0], [88.1, 112.0], [88.2, 112.0], [88.3, 112.0], [88.4, 112.0], [88.5, 112.0], [88.6, 112.0], [88.7, 112.0], [88.8, 112.0], [88.9, 113.0], [89.0, 113.0], [89.1, 113.0], [89.2, 113.0], [89.3, 113.0], [89.4, 113.0], [89.5, 113.0], [89.6, 113.0], [89.7, 113.0], [89.8, 113.0], [89.9, 113.0], [90.0, 113.0], [90.1, 113.0], [90.2, 113.0], [90.3, 113.0], [90.4, 113.0], [90.5, 114.0], [90.6, 114.0], [90.7, 114.0], [90.8, 114.0], [90.9, 114.0], [91.0, 114.0], [91.1, 114.0], [91.2, 114.0], [91.3, 115.0], [91.4, 115.0], [91.5, 115.0], [91.6, 115.0], [91.7, 115.0], [91.8, 115.0], [91.9, 116.0], [92.0, 116.0], [92.1, 116.0], [92.2, 116.0], [92.3, 117.0], [92.4, 117.0], [92.5, 117.0], [92.6, 117.0], [92.7, 118.0], [92.8, 118.0], [92.9, 118.0], [93.0, 119.0], [93.1, 119.0], [93.2, 119.0], [93.3, 119.0], [93.4, 120.0], [93.5, 120.0], [93.6, 120.0], [93.7, 121.0], [93.8, 121.0], [93.9, 122.0], [94.0, 122.0], [94.1, 122.0], [94.2, 123.0], [94.3, 123.0], [94.4, 124.0], [94.5, 125.0], [94.6, 125.0], [94.7, 126.0], [94.8, 127.0], [94.9, 128.0], [95.0, 130.0], [95.1, 131.0], [95.2, 133.0], [95.3, 135.0], [95.4, 138.0], [95.5, 140.0], [95.6, 145.0], [95.7, 147.0], [95.8, 153.0], [95.9, 159.0], [96.0, 167.0], [96.1, 192.0], [96.2, 209.0], [96.3, 227.0], [96.4, 373.0], [96.5, 422.0], [96.6, 1105.0], [96.7, 5086.0], [96.8, 5089.0], [96.9, 5090.0], [97.0, 5091.0], [97.1, 5091.0], [97.2, 5092.0], [97.3, 5093.0], [97.4, 5094.0], [97.5, 5095.0], [97.6, 5096.0], [97.7, 5096.0], [97.8, 5097.0], [97.9, 5098.0], [98.0, 5099.0], [98.1, 5100.0], [98.2, 5101.0], [98.3, 5101.0], [98.4, 5101.0], [98.5, 5102.0], [98.6, 5103.0], [98.7, 5103.0], [98.8, 5104.0], [98.9, 5106.0], [99.0, 5106.0], [99.1, 5108.0], [99.2, 5109.0], [99.3, 5111.0], [99.4, 5112.0], [99.5, 5114.0], [99.6, 5116.0], [99.7, 5118.0], [99.8, 5123.0], [99.9, 5127.0]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 0.0, "maxY": 5761.0, "series": [{"data": [[0.0, 2532.0], [1100.0, 2.0], [300.0, 8.0], [5000.0, 119.0], [5100.0, 162.0], [5300.0, 1.0], [5200.0, 3.0], [3100.0, 7.0], [100.0, 5761.0], [400.0, 9.0], [200.0, 21.0], [500.0, 1.0]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 5300.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 3.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 8331.0, "series": [{"data": [[0.0, 8331.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [[1.0, 3.0]], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [[2.0, 292.0]], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 2.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 25.064052795031035, "minX": 1.77728136E12, "maxY": 49.01421487603312, "series": [{"data": [[1.77728136E12, 25.064052795031035], [1.77728142E12, 49.01421487603312]], "isOverall": false, "label": "Stress Test - 50 Threads", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728142E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 148.89763779527564, "minX": 1.0, "maxY": 1108.2, "series": [{"data": [[2.0, 520.5833333333334], [3.0, 398.7647058823529], [4.0, 313.45833333333337], [5.0, 282.8928571428571], [6.0, 268.79999999999995], [7.0, 258.1875], [8.0, 241.97222222222223], [9.0, 225.34146341463412], [10.0, 209.0], [11.0, 215.77272727272728], [12.0, 228.29999999999998], [13.0, 225.8048780487805], [14.0, 327.02222222222224], [15.0, 307.44897959183675], [16.0, 197.0566037735849], [17.0, 189.94827586206895], [18.0, 190.70175438596493], [19.0, 330.909090909091], [20.0, 233.09090909090915], [21.0, 208.91489361702125], [22.0, 200.44117647058835], [23.0, 153.83673469387747], [24.0, 239.16363636363633], [25.0, 152.66666666666666], [26.0, 203.6666666666666], [27.0, 207.35416666666669], [28.0, 159.3956043956044], [29.0, 160.34883720930236], [30.0, 254.75757575757575], [31.0, 241.72222222222229], [32.0, 229.1012658227848], [33.0, 283.0120481927711], [34.0, 358.89743589743597], [35.0, 265.41304347826076], [36.0, 153.58000000000004], [37.0, 211.54347826086965], [38.0, 302.72], [39.0, 418.94680851063833], [40.0, 220.83838383838395], [41.0, 249.49425287356323], [42.0, 272.1190476190476], [43.0, 148.89763779527564], [44.0, 155.6601941747572], [45.0, 345.51428571428585], [46.0, 151.35398230088495], [47.0, 226.1788617886179], [48.0, 246.41258741258744], [49.0, 165.9172932330827], [50.0, 304.0632403131903], [1.0, 1108.2]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}, {"data": [[41.861929051704216, 273.20855552979367]], "isOverall": false, "label": "GET /api/listings (Stress)-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 50.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 7642.133333333333, "minX": 1.77728136E12, "maxY": 903866.1166666667, "series": [{"data": [[1.77728136E12, 384854.4], [1.77728142E12, 903866.1166666667]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.77728136E12, 7642.133333333333], [1.77728142E12, 17948.333333333332]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728142E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 171.7721273291927, "minX": 1.77728136E12, "maxY": 316.3986776859501, "series": [{"data": [[1.77728136E12, 171.7721273291927], [1.77728142E12, 316.3986776859501]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728142E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 171.10908385093134, "minX": 1.77728136E12, "maxY": 315.667603305784, "series": [{"data": [[1.77728136E12, 171.10908385093134], [1.77728142E12, 315.667603305784]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728142E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 111.49650621118005, "minX": 1.77728136E12, "maxY": 259.69818181818175, "series": [{"data": [[1.77728136E12, 111.49650621118005], [1.77728142E12, 259.69818181818175]], "isOverall": false, "label": "GET /api/listings (Stress)", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728142E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 93.0, "minX": 1.77728136E12, "maxY": 5353.0, "series": [{"data": [[1.77728136E12, 5353.0], [1.77728142E12, 5156.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.77728136E12, 93.0], [1.77728142E12, 93.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.77728136E12, 112.0], [1.77728142E12, 114.0]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.77728136E12, 5090.0], [1.77728142E12, 5109.0]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.77728136E12, 103.0], [1.77728142E12, 104.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.77728136E12, 126.0], [1.77728142E12, 134.44999999999982]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728142E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 101.0, "minX": 1.0, "maxY": 5107.5, "series": [{"data": [[3.0, 5099.0], [5.0, 5103.0], [6.0, 5107.5], [8.0, 5103.0], [11.0, 5106.0], [15.0, 105.0], [32.0, 104.0], [46.0, 104.5], [51.0, 101.0], [62.0, 103.0], [67.0, 103.0], [69.0, 104.0], [74.0, 102.0], [80.0, 103.0], [92.0, 103.0], [99.0, 103.0], [104.0, 145.0], [109.0, 102.0], [115.0, 103.0], [122.0, 103.0], [126.0, 102.0], [134.0, 103.0], [132.0, 102.0], [129.0, 103.0], [142.0, 103.5], [140.0, 103.0], [136.0, 104.0], [139.0, 103.0], [149.0, 103.0], [150.0, 102.0], [151.0, 103.0], [159.0, 103.0], [155.0, 117.0], [156.0, 104.5], [158.0, 104.0], [153.0, 102.5], [157.0, 102.0], [162.0, 102.0], [167.0, 103.0], [163.0, 103.0], [165.0, 103.0], [166.0, 103.0], [172.0, 102.0], [173.0, 104.0], [170.0, 103.0], [181.0, 103.0], [183.0, 103.0], [188.0, 115.0], [195.0, 108.0], [199.0, 105.0], [192.0, 102.0], [201.0, 103.0], [203.0, 103.0], [211.0, 104.0], [217.0, 103.0], [230.0, 106.0], [1.0, 122.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 230.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 101.0, "minX": 1.0, "maxY": 5107.0, "series": [{"data": [[3.0, 5098.0], [5.0, 5103.0], [6.0, 5107.0], [8.0, 5102.5], [11.0, 5105.0], [15.0, 104.0], [32.0, 104.0], [46.0, 104.0], [51.0, 101.0], [62.0, 102.0], [67.0, 102.0], [69.0, 104.0], [74.0, 101.0], [80.0, 102.0], [92.0, 103.0], [99.0, 103.0], [104.0, 144.0], [109.0, 102.0], [115.0, 103.0], [122.0, 103.0], [126.0, 102.0], [134.0, 102.0], [132.0, 101.0], [129.0, 103.0], [142.0, 103.0], [140.0, 102.0], [136.0, 103.5], [139.0, 102.0], [149.0, 102.0], [150.0, 102.0], [151.0, 102.0], [159.0, 102.0], [155.0, 116.0], [156.0, 104.0], [158.0, 103.0], [153.0, 102.0], [157.0, 102.0], [162.0, 102.0], [167.0, 103.0], [163.0, 102.0], [165.0, 102.0], [166.0, 102.0], [172.0, 101.0], [173.0, 103.0], [170.0, 102.0], [181.0, 102.0], [183.0, 102.0], [188.0, 114.0], [195.0, 107.0], [199.0, 104.0], [192.0, 101.0], [201.0, 102.0], [203.0, 102.0], [211.0, 104.0], [217.0, 102.0], [230.0, 105.0], [1.0, 118.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 230.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 43.61666666666667, "minX": 1.77728136E12, "maxY": 100.15, "series": [{"data": [[1.77728136E12, 43.61666666666667], [1.77728142E12, 100.15]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728142E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 42.93333333333333, "minX": 1.77728136E12, "maxY": 100.83333333333333, "series": [{"data": [[1.77728136E12, 42.93333333333333], [1.77728142E12, 100.83333333333333]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728142E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 42.93333333333333, "minX": 1.77728136E12, "maxY": 100.83333333333333, "series": [{"data": [[1.77728136E12, 42.93333333333333], [1.77728142E12, 100.83333333333333]], "isOverall": false, "label": "GET /api/listings (Stress)-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728142E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 42.93333333333333, "minX": 1.77728136E12, "maxY": 100.83333333333333, "series": [{"data": [[1.77728136E12, 42.93333333333333], [1.77728142E12, 100.83333333333333]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728142E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 25200000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

