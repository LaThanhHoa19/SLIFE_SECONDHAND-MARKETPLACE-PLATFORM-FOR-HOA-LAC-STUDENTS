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
        data: {"result": {"minY": 95.0, "minX": 0.0, "maxY": 5124.0, "series": [{"data": [[0.0, 95.0], [0.1, 95.0], [0.2, 96.0], [0.3, 96.0], [0.4, 96.0], [0.5, 96.0], [0.6, 96.0], [0.7, 96.0], [0.8, 96.0], [0.9, 96.0], [1.0, 96.0], [1.1, 96.0], [1.2, 96.0], [1.3, 96.0], [1.4, 96.0], [1.5, 96.0], [1.6, 96.0], [1.7, 97.0], [1.8, 97.0], [1.9, 97.0], [2.0, 97.0], [2.1, 97.0], [2.2, 97.0], [2.3, 97.0], [2.4, 97.0], [2.5, 97.0], [2.6, 97.0], [2.7, 97.0], [2.8, 97.0], [2.9, 97.0], [3.0, 97.0], [3.1, 97.0], [3.2, 97.0], [3.3, 97.0], [3.4, 97.0], [3.5, 97.0], [3.6, 97.0], [3.7, 97.0], [3.8, 97.0], [3.9, 97.0], [4.0, 97.0], [4.1, 97.0], [4.2, 97.0], [4.3, 97.0], [4.4, 97.0], [4.5, 97.0], [4.6, 97.0], [4.7, 97.0], [4.8, 97.0], [4.9, 97.0], [5.0, 97.0], [5.1, 97.0], [5.2, 97.0], [5.3, 97.0], [5.4, 97.0], [5.5, 97.0], [5.6, 97.0], [5.7, 97.0], [5.8, 97.0], [5.9, 97.0], [6.0, 97.0], [6.1, 97.0], [6.2, 97.0], [6.3, 98.0], [6.4, 98.0], [6.5, 98.0], [6.6, 98.0], [6.7, 98.0], [6.8, 98.0], [6.9, 98.0], [7.0, 98.0], [7.1, 98.0], [7.2, 98.0], [7.3, 98.0], [7.4, 98.0], [7.5, 98.0], [7.6, 98.0], [7.7, 98.0], [7.8, 98.0], [7.9, 98.0], [8.0, 98.0], [8.1, 98.0], [8.2, 98.0], [8.3, 98.0], [8.4, 98.0], [8.5, 98.0], [8.6, 98.0], [8.7, 98.0], [8.8, 98.0], [8.9, 98.0], [9.0, 98.0], [9.1, 98.0], [9.2, 98.0], [9.3, 98.0], [9.4, 98.0], [9.5, 98.0], [9.6, 98.0], [9.7, 98.0], [9.8, 98.0], [9.9, 98.0], [10.0, 98.0], [10.1, 98.0], [10.2, 98.0], [10.3, 98.0], [10.4, 98.0], [10.5, 98.0], [10.6, 98.0], [10.7, 98.0], [10.8, 98.0], [10.9, 98.0], [11.0, 98.0], [11.1, 98.0], [11.2, 99.0], [11.3, 99.0], [11.4, 99.0], [11.5, 99.0], [11.6, 99.0], [11.7, 99.0], [11.8, 99.0], [11.9, 99.0], [12.0, 99.0], [12.1, 99.0], [12.2, 99.0], [12.3, 99.0], [12.4, 99.0], [12.5, 99.0], [12.6, 99.0], [12.7, 99.0], [12.8, 99.0], [12.9, 99.0], [13.0, 99.0], [13.1, 99.0], [13.2, 99.0], [13.3, 99.0], [13.4, 99.0], [13.5, 99.0], [13.6, 99.0], [13.7, 99.0], [13.8, 99.0], [13.9, 99.0], [14.0, 99.0], [14.1, 100.0], [14.2, 100.0], [14.3, 100.0], [14.4, 100.0], [14.5, 100.0], [14.6, 100.0], [14.7, 100.0], [14.8, 100.0], [14.9, 100.0], [15.0, 100.0], [15.1, 100.0], [15.2, 100.0], [15.3, 100.0], [15.4, 100.0], [15.5, 100.0], [15.6, 100.0], [15.7, 100.0], [15.8, 100.0], [15.9, 100.0], [16.0, 100.0], [16.1, 100.0], [16.2, 100.0], [16.3, 100.0], [16.4, 100.0], [16.5, 100.0], [16.6, 100.0], [16.7, 100.0], [16.8, 100.0], [16.9, 100.0], [17.0, 100.0], [17.1, 100.0], [17.2, 100.0], [17.3, 100.0], [17.4, 100.0], [17.5, 100.0], [17.6, 100.0], [17.7, 100.0], [17.8, 100.0], [17.9, 100.0], [18.0, 100.0], [18.1, 100.0], [18.2, 101.0], [18.3, 101.0], [18.4, 101.0], [18.5, 101.0], [18.6, 101.0], [18.7, 101.0], [18.8, 101.0], [18.9, 101.0], [19.0, 101.0], [19.1, 101.0], [19.2, 101.0], [19.3, 101.0], [19.4, 101.0], [19.5, 101.0], [19.6, 101.0], [19.7, 101.0], [19.8, 101.0], [19.9, 101.0], [20.0, 101.0], [20.1, 101.0], [20.2, 101.0], [20.3, 101.0], [20.4, 101.0], [20.5, 101.0], [20.6, 101.0], [20.7, 101.0], [20.8, 101.0], [20.9, 101.0], [21.0, 101.0], [21.1, 101.0], [21.2, 101.0], [21.3, 101.0], [21.4, 101.0], [21.5, 101.0], [21.6, 101.0], [21.7, 101.0], [21.8, 101.0], [21.9, 101.0], [22.0, 101.0], [22.1, 101.0], [22.2, 101.0], [22.3, 101.0], [22.4, 101.0], [22.5, 101.0], [22.6, 101.0], [22.7, 101.0], [22.8, 101.0], [22.9, 101.0], [23.0, 101.0], [23.1, 101.0], [23.2, 101.0], [23.3, 101.0], [23.4, 101.0], [23.5, 101.0], [23.6, 102.0], [23.7, 102.0], [23.8, 102.0], [23.9, 102.0], [24.0, 102.0], [24.1, 102.0], [24.2, 102.0], [24.3, 102.0], [24.4, 102.0], [24.5, 102.0], [24.6, 102.0], [24.7, 102.0], [24.8, 102.0], [24.9, 102.0], [25.0, 102.0], [25.1, 102.0], [25.2, 102.0], [25.3, 102.0], [25.4, 102.0], [25.5, 102.0], [25.6, 102.0], [25.7, 102.0], [25.8, 102.0], [25.9, 102.0], [26.0, 102.0], [26.1, 102.0], [26.2, 102.0], [26.3, 102.0], [26.4, 102.0], [26.5, 102.0], [26.6, 102.0], [26.7, 102.0], [26.8, 102.0], [26.9, 102.0], [27.0, 102.0], [27.1, 103.0], [27.2, 103.0], [27.3, 103.0], [27.4, 103.0], [27.5, 103.0], [27.6, 103.0], [27.7, 103.0], [27.8, 103.0], [27.9, 103.0], [28.0, 103.0], [28.1, 103.0], [28.2, 103.0], [28.3, 103.0], [28.4, 103.0], [28.5, 103.0], [28.6, 103.0], [28.7, 103.0], [28.8, 103.0], [28.9, 103.0], [29.0, 103.0], [29.1, 103.0], [29.2, 103.0], [29.3, 103.0], [29.4, 103.0], [29.5, 103.0], [29.6, 103.0], [29.7, 103.0], [29.8, 103.0], [29.9, 103.0], [30.0, 103.0], [30.1, 103.0], [30.2, 103.0], [30.3, 103.0], [30.4, 103.0], [30.5, 103.0], [30.6, 103.0], [30.7, 103.0], [30.8, 103.0], [30.9, 103.0], [31.0, 103.0], [31.1, 104.0], [31.2, 104.0], [31.3, 104.0], [31.4, 104.0], [31.5, 104.0], [31.6, 104.0], [31.7, 104.0], [31.8, 104.0], [31.9, 104.0], [32.0, 104.0], [32.1, 104.0], [32.2, 104.0], [32.3, 104.0], [32.4, 104.0], [32.5, 104.0], [32.6, 104.0], [32.7, 104.0], [32.8, 104.0], [32.9, 104.0], [33.0, 104.0], [33.1, 104.0], [33.2, 104.0], [33.3, 104.0], [33.4, 104.0], [33.5, 104.0], [33.6, 104.0], [33.7, 104.0], [33.8, 104.0], [33.9, 104.0], [34.0, 104.0], [34.1, 104.0], [34.2, 104.0], [34.3, 104.0], [34.4, 104.0], [34.5, 104.0], [34.6, 104.0], [34.7, 104.0], [34.8, 104.0], [34.9, 104.0], [35.0, 104.0], [35.1, 104.0], [35.2, 104.0], [35.3, 104.0], [35.4, 104.0], [35.5, 104.0], [35.6, 104.0], [35.7, 104.0], [35.8, 104.0], [35.9, 104.0], [36.0, 104.0], [36.1, 104.0], [36.2, 104.0], [36.3, 104.0], [36.4, 104.0], [36.5, 104.0], [36.6, 104.0], [36.7, 104.0], [36.8, 104.0], [36.9, 105.0], [37.0, 105.0], [37.1, 105.0], [37.2, 105.0], [37.3, 105.0], [37.4, 105.0], [37.5, 105.0], [37.6, 105.0], [37.7, 105.0], [37.8, 105.0], [37.9, 105.0], [38.0, 105.0], [38.1, 105.0], [38.2, 105.0], [38.3, 105.0], [38.4, 105.0], [38.5, 105.0], [38.6, 105.0], [38.7, 105.0], [38.8, 105.0], [38.9, 105.0], [39.0, 105.0], [39.1, 105.0], [39.2, 105.0], [39.3, 105.0], [39.4, 105.0], [39.5, 105.0], [39.6, 105.0], [39.7, 105.0], [39.8, 105.0], [39.9, 105.0], [40.0, 105.0], [40.1, 105.0], [40.2, 105.0], [40.3, 105.0], [40.4, 105.0], [40.5, 105.0], [40.6, 105.0], [40.7, 105.0], [40.8, 105.0], [40.9, 105.0], [41.0, 105.0], [41.1, 105.0], [41.2, 105.0], [41.3, 105.0], [41.4, 105.0], [41.5, 105.0], [41.6, 105.0], [41.7, 105.0], [41.8, 105.0], [41.9, 105.0], [42.0, 105.0], [42.1, 105.0], [42.2, 105.0], [42.3, 105.0], [42.4, 105.0], [42.5, 105.0], [42.6, 105.0], [42.7, 105.0], [42.8, 105.0], [42.9, 106.0], [43.0, 106.0], [43.1, 106.0], [43.2, 106.0], [43.3, 106.0], [43.4, 106.0], [43.5, 106.0], [43.6, 106.0], [43.7, 106.0], [43.8, 106.0], [43.9, 106.0], [44.0, 106.0], [44.1, 106.0], [44.2, 106.0], [44.3, 106.0], [44.4, 106.0], [44.5, 106.0], [44.6, 106.0], [44.7, 106.0], [44.8, 106.0], [44.9, 106.0], [45.0, 106.0], [45.1, 106.0], [45.2, 106.0], [45.3, 106.0], [45.4, 106.0], [45.5, 106.0], [45.6, 106.0], [45.7, 106.0], [45.8, 106.0], [45.9, 106.0], [46.0, 107.0], [46.1, 107.0], [46.2, 107.0], [46.3, 107.0], [46.4, 107.0], [46.5, 107.0], [46.6, 107.0], [46.7, 107.0], [46.8, 107.0], [46.9, 107.0], [47.0, 107.0], [47.1, 107.0], [47.2, 107.0], [47.3, 107.0], [47.4, 107.0], [47.5, 107.0], [47.6, 107.0], [47.7, 107.0], [47.8, 107.0], [47.9, 107.0], [48.0, 107.0], [48.1, 107.0], [48.2, 107.0], [48.3, 107.0], [48.4, 107.0], [48.5, 107.0], [48.6, 107.0], [48.7, 107.0], [48.8, 107.0], [48.9, 107.0], [49.0, 107.0], [49.1, 107.0], [49.2, 107.0], [49.3, 107.0], [49.4, 107.0], [49.5, 107.0], [49.6, 107.0], [49.7, 107.0], [49.8, 107.0], [49.9, 107.0], [50.0, 107.0], [50.1, 107.0], [50.2, 107.0], [50.3, 107.0], [50.4, 107.0], [50.5, 107.0], [50.6, 107.0], [50.7, 107.0], [50.8, 108.0], [50.9, 108.0], [51.0, 108.0], [51.1, 108.0], [51.2, 108.0], [51.3, 108.0], [51.4, 108.0], [51.5, 108.0], [51.6, 108.0], [51.7, 108.0], [51.8, 108.0], [51.9, 108.0], [52.0, 108.0], [52.1, 108.0], [52.2, 108.0], [52.3, 108.0], [52.4, 108.0], [52.5, 108.0], [52.6, 108.0], [52.7, 108.0], [52.8, 108.0], [52.9, 108.0], [53.0, 108.0], [53.1, 108.0], [53.2, 108.0], [53.3, 108.0], [53.4, 108.0], [53.5, 108.0], [53.6, 108.0], [53.7, 108.0], [53.8, 108.0], [53.9, 108.0], [54.0, 108.0], [54.1, 108.0], [54.2, 108.0], [54.3, 108.0], [54.4, 108.0], [54.5, 108.0], [54.6, 108.0], [54.7, 108.0], [54.8, 108.0], [54.9, 108.0], [55.0, 108.0], [55.1, 108.0], [55.2, 108.0], [55.3, 108.0], [55.4, 108.0], [55.5, 108.0], [55.6, 108.0], [55.7, 108.0], [55.8, 108.0], [55.9, 108.0], [56.0, 108.0], [56.1, 108.0], [56.2, 109.0], [56.3, 109.0], [56.4, 109.0], [56.5, 109.0], [56.6, 109.0], [56.7, 109.0], [56.8, 109.0], [56.9, 109.0], [57.0, 109.0], [57.1, 109.0], [57.2, 109.0], [57.3, 109.0], [57.4, 109.0], [57.5, 109.0], [57.6, 109.0], [57.7, 109.0], [57.8, 109.0], [57.9, 109.0], [58.0, 109.0], [58.1, 109.0], [58.2, 109.0], [58.3, 109.0], [58.4, 109.0], [58.5, 109.0], [58.6, 109.0], [58.7, 109.0], [58.8, 109.0], [58.9, 109.0], [59.0, 109.0], [59.1, 109.0], [59.2, 110.0], [59.3, 110.0], [59.4, 110.0], [59.5, 110.0], [59.6, 110.0], [59.7, 110.0], [59.8, 110.0], [59.9, 110.0], [60.0, 110.0], [60.1, 110.0], [60.2, 110.0], [60.3, 110.0], [60.4, 110.0], [60.5, 110.0], [60.6, 110.0], [60.7, 110.0], [60.8, 110.0], [60.9, 110.0], [61.0, 110.0], [61.1, 110.0], [61.2, 110.0], [61.3, 110.0], [61.4, 110.0], [61.5, 110.0], [61.6, 110.0], [61.7, 110.0], [61.8, 110.0], [61.9, 110.0], [62.0, 110.0], [62.1, 110.0], [62.2, 110.0], [62.3, 110.0], [62.4, 110.0], [62.5, 110.0], [62.6, 110.0], [62.7, 110.0], [62.8, 110.0], [62.9, 110.0], [63.0, 110.0], [63.1, 110.0], [63.2, 111.0], [63.3, 111.0], [63.4, 111.0], [63.5, 111.0], [63.6, 111.0], [63.7, 111.0], [63.8, 111.0], [63.9, 111.0], [64.0, 111.0], [64.1, 111.0], [64.2, 111.0], [64.3, 111.0], [64.4, 111.0], [64.5, 111.0], [64.6, 111.0], [64.7, 111.0], [64.8, 111.0], [64.9, 111.0], [65.0, 111.0], [65.1, 111.0], [65.2, 111.0], [65.3, 111.0], [65.4, 111.0], [65.5, 111.0], [65.6, 111.0], [65.7, 111.0], [65.8, 111.0], [65.9, 111.0], [66.0, 111.0], [66.1, 111.0], [66.2, 111.0], [66.3, 111.0], [66.4, 111.0], [66.5, 111.0], [66.6, 111.0], [66.7, 111.0], [66.8, 111.0], [66.9, 111.0], [67.0, 111.0], [67.1, 111.0], [67.2, 111.0], [67.3, 111.0], [67.4, 111.0], [67.5, 111.0], [67.6, 111.0], [67.7, 111.0], [67.8, 111.0], [67.9, 111.0], [68.0, 111.0], [68.1, 111.0], [68.2, 111.0], [68.3, 111.0], [68.4, 111.0], [68.5, 111.0], [68.6, 111.0], [68.7, 111.0], [68.8, 111.0], [68.9, 111.0], [69.0, 111.0], [69.1, 111.0], [69.2, 111.0], [69.3, 111.0], [69.4, 111.0], [69.5, 111.0], [69.6, 112.0], [69.7, 112.0], [69.8, 112.0], [69.9, 112.0], [70.0, 112.0], [70.1, 112.0], [70.2, 112.0], [70.3, 112.0], [70.4, 112.0], [70.5, 112.0], [70.6, 112.0], [70.7, 112.0], [70.8, 112.0], [70.9, 112.0], [71.0, 112.0], [71.1, 112.0], [71.2, 112.0], [71.3, 112.0], [71.4, 112.0], [71.5, 112.0], [71.6, 112.0], [71.7, 112.0], [71.8, 112.0], [71.9, 112.0], [72.0, 112.0], [72.1, 112.0], [72.2, 112.0], [72.3, 112.0], [72.4, 112.0], [72.5, 112.0], [72.6, 112.0], [72.7, 112.0], [72.8, 112.0], [72.9, 112.0], [73.0, 112.0], [73.1, 112.0], [73.2, 112.0], [73.3, 112.0], [73.4, 112.0], [73.5, 112.0], [73.6, 112.0], [73.7, 112.0], [73.8, 112.0], [73.9, 112.0], [74.0, 112.0], [74.1, 112.0], [74.2, 112.0], [74.3, 112.0], [74.4, 112.0], [74.5, 112.0], [74.6, 112.0], [74.7, 112.0], [74.8, 112.0], [74.9, 112.0], [75.0, 113.0], [75.1, 113.0], [75.2, 113.0], [75.3, 113.0], [75.4, 113.0], [75.5, 113.0], [75.6, 113.0], [75.7, 113.0], [75.8, 113.0], [75.9, 113.0], [76.0, 113.0], [76.1, 113.0], [76.2, 113.0], [76.3, 113.0], [76.4, 113.0], [76.5, 113.0], [76.6, 113.0], [76.7, 113.0], [76.8, 113.0], [76.9, 113.0], [77.0, 113.0], [77.1, 113.0], [77.2, 113.0], [77.3, 113.0], [77.4, 113.0], [77.5, 113.0], [77.6, 113.0], [77.7, 114.0], [77.8, 114.0], [77.9, 114.0], [78.0, 114.0], [78.1, 114.0], [78.2, 114.0], [78.3, 114.0], [78.4, 114.0], [78.5, 114.0], [78.6, 114.0], [78.7, 114.0], [78.8, 114.0], [78.9, 114.0], [79.0, 114.0], [79.1, 114.0], [79.2, 114.0], [79.3, 114.0], [79.4, 114.0], [79.5, 114.0], [79.6, 114.0], [79.7, 114.0], [79.8, 114.0], [79.9, 114.0], [80.0, 114.0], [80.1, 114.0], [80.2, 114.0], [80.3, 114.0], [80.4, 114.0], [80.5, 114.0], [80.6, 114.0], [80.7, 114.0], [80.8, 114.0], [80.9, 114.0], [81.0, 114.0], [81.1, 114.0], [81.2, 114.0], [81.3, 114.0], [81.4, 114.0], [81.5, 114.0], [81.6, 114.0], [81.7, 114.0], [81.8, 114.0], [81.9, 114.0], [82.0, 114.0], [82.1, 114.0], [82.2, 114.0], [82.3, 115.0], [82.4, 115.0], [82.5, 115.0], [82.6, 115.0], [82.7, 115.0], [82.8, 115.0], [82.9, 115.0], [83.0, 115.0], [83.1, 115.0], [83.2, 115.0], [83.3, 115.0], [83.4, 115.0], [83.5, 115.0], [83.6, 115.0], [83.7, 115.0], [83.8, 115.0], [83.9, 115.0], [84.0, 115.0], [84.1, 115.0], [84.2, 115.0], [84.3, 115.0], [84.4, 115.0], [84.5, 115.0], [84.6, 115.0], [84.7, 115.0], [84.8, 115.0], [84.9, 115.0], [85.0, 115.0], [85.1, 115.0], [85.2, 115.0], [85.3, 115.0], [85.4, 115.0], [85.5, 115.0], [85.6, 115.0], [85.7, 115.0], [85.8, 115.0], [85.9, 115.0], [86.0, 115.0], [86.1, 115.0], [86.2, 115.0], [86.3, 115.0], [86.4, 115.0], [86.5, 115.0], [86.6, 115.0], [86.7, 115.0], [86.8, 116.0], [86.9, 116.0], [87.0, 116.0], [87.1, 116.0], [87.2, 116.0], [87.3, 116.0], [87.4, 116.0], [87.5, 116.0], [87.6, 116.0], [87.7, 116.0], [87.8, 116.0], [87.9, 116.0], [88.0, 116.0], [88.1, 116.0], [88.2, 116.0], [88.3, 116.0], [88.4, 116.0], [88.5, 116.0], [88.6, 116.0], [88.7, 116.0], [88.8, 116.0], [88.9, 116.0], [89.0, 116.0], [89.1, 116.0], [89.2, 116.0], [89.3, 117.0], [89.4, 117.0], [89.5, 117.0], [89.6, 117.0], [89.7, 117.0], [89.8, 117.0], [89.9, 117.0], [90.0, 117.0], [90.1, 117.0], [90.2, 117.0], [90.3, 117.0], [90.4, 117.0], [90.5, 117.0], [90.6, 117.0], [90.7, 117.0], [90.8, 117.0], [90.9, 117.0], [91.0, 118.0], [91.1, 118.0], [91.2, 118.0], [91.3, 118.0], [91.4, 118.0], [91.5, 118.0], [91.6, 118.0], [91.7, 118.0], [91.8, 118.0], [91.9, 119.0], [92.0, 119.0], [92.1, 119.0], [92.2, 119.0], [92.3, 119.0], [92.4, 119.0], [92.5, 120.0], [92.6, 120.0], [92.7, 120.0], [92.8, 120.0], [92.9, 120.0], [93.0, 120.0], [93.1, 121.0], [93.2, 121.0], [93.3, 121.0], [93.4, 121.0], [93.5, 122.0], [93.6, 123.0], [93.7, 123.0], [93.8, 123.0], [93.9, 124.0], [94.0, 124.0], [94.1, 124.0], [94.2, 124.0], [94.3, 125.0], [94.4, 125.0], [94.5, 125.0], [94.6, 125.0], [94.7, 126.0], [94.8, 127.0], [94.9, 127.0], [95.0, 127.0], [95.1, 128.0], [95.2, 128.0], [95.3, 129.0], [95.4, 129.0], [95.5, 129.0], [95.6, 130.0], [95.7, 130.0], [95.8, 132.0], [95.9, 132.0], [96.0, 133.0], [96.1, 134.0], [96.2, 134.0], [96.3, 135.0], [96.4, 136.0], [96.5, 138.0], [96.6, 138.0], [96.7, 139.0], [96.8, 140.0], [96.9, 144.0], [97.0, 145.0], [97.1, 146.0], [97.2, 148.0], [97.3, 148.0], [97.4, 151.0], [97.5, 164.0], [97.6, 167.0], [97.7, 209.0], [97.8, 242.0], [97.9, 397.0], [98.0, 1112.0], [98.1, 3131.0], [98.2, 5093.0], [98.3, 5095.0], [98.4, 5098.0], [98.5, 5099.0], [98.6, 5100.0], [98.7, 5101.0], [98.8, 5101.0], [98.9, 5102.0], [99.0, 5105.0], [99.1, 5106.0], [99.2, 5106.0], [99.3, 5109.0], [99.4, 5111.0], [99.5, 5112.0], [99.6, 5114.0], [99.7, 5116.0], [99.8, 5117.0], [99.9, 5119.0], [100.0, 5124.0]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
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
        data: {"result": {"minY": 1.0, "minX": 0.0, "maxY": 1800.0, "series": [{"data": [[0.0, 302.0], [1100.0, 2.0], [300.0, 2.0], [5000.0, 8.0], [5100.0, 32.0], [3100.0, 2.0], [100.0, 1800.0], [400.0, 1.0], [200.0, 3.0]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 5100.0, "title": "Response Time Distribution"}},
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
        data: {"result": {"minY": 2.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 2108.0, "series": [{"data": [[0.0, 2108.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [[1.0, 2.0]], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [[2.0, 42.0]], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 2.0, "title": "Synthetic Response Times Distribution"}},
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
        data: {"result": {"minY": 6.826666666666665, "minX": 1.7772813E12, "maxY": 14.766490129995187, "series": [{"data": [[1.77728136E12, 14.766490129995187], [1.7772813E12, 6.826666666666665]], "isOverall": false, "label": "Community Posts - 15 Threads", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728136E12, "title": "Active Threads Over Time"}},
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
        data: {"result": {"minY": 110.82051282051285, "minX": 1.0, "maxY": 2631.5, "series": [{"data": [[2.0, 1105.4], [8.0, 406.1764705882353], [9.0, 373.9], [10.0, 121.33333333333333], [11.0, 120.33333333333331], [3.0, 942.5], [12.0, 113.50000000000001], [13.0, 111.96874999999999], [14.0, 110.82051282051285], [15.0, 191.8990109318065], [1.0, 2631.5], [4.0, 1110.2], [5.0, 1976.6666666666667], [6.0, 743.4444444444445], [7.0, 422.4375]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}, {"data": [[14.489776951672862, 205.09758364312282]], "isOverall": false, "label": "GET /api/community/posts-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 15.0, "title": "Time VS Threads"}},
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
        data : {"result": {"minY": 222.5, "minX": 1.7772813E12, "maxY": 119496.73333333334, "series": [{"data": [[1.77728136E12, 119496.73333333334], [1.7772813E12, 4315.0]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.77728136E12, 6161.766666666666], [1.7772813E12, 222.5]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728136E12, "title": "Bytes Throughput Over Time"}},
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
        data: {"result": {"minY": 132.4000000000001, "minX": 1.7772813E12, "maxY": 207.72267693789124, "series": [{"data": [[1.77728136E12, 207.72267693789124], [1.7772813E12, 132.4000000000001]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728136E12, "title": "Response Time Over Time"}},
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
        data: {"result": {"minY": 132.0933333333333, "minX": 1.7772813E12, "maxY": 207.55272026961984, "series": [{"data": [[1.77728136E12, 207.55272026961984], [1.7772813E12, 132.0933333333333]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728136E12, "title": "Latencies Over Time"}},
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
        data: {"result": {"minY": 49.05333333333333, "minX": 1.7772813E12, "maxY": 147.62060664419838, "series": [{"data": [[1.77728136E12, 147.62060664419838], [1.7772813E12, 49.05333333333333]], "isOverall": false, "label": "GET /api/community/posts", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728136E12, "title": "Connect Time Over Time"}},
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
        data: {"result": {"minY": 95.0, "minX": 1.7772813E12, "maxY": 5124.0, "series": [{"data": [[1.77728136E12, 5124.0], [1.7772813E12, 428.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.77728136E12, 95.0], [1.7772813E12, 99.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.77728136E12, 116.0], [1.7772813E12, 166.60000000000002]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.77728136E12, 5105.219999999999], [1.7772813E12, 428.0]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.77728136E12, 107.0], [1.7772813E12, 114.0]], "isOverall": false, "label": "Median", "isController": false}, {"data": [[1.77728136E12, 125.0], [1.7772813E12, 272.6000000000004]], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728136E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
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
    data: {"result": {"minY": 104.0, "minX": 1.0, "maxY": 5121.0, "series": [{"data": [[2.0, 5103.0], [44.0, 106.5], [3.0, 5104.0], [50.0, 114.0], [55.0, 105.0], [56.0, 105.0], [61.0, 107.0], [62.0, 106.5], [65.0, 104.0], [66.0, 106.0], [67.0, 108.0], [71.0, 106.0], [69.0, 104.0], [74.0, 107.0], [75.0, 107.0], [73.0, 106.0], [78.0, 115.5], [77.0, 107.0], [83.0, 107.0], [80.0, 106.5], [85.0, 105.0], [89.0, 107.0], [92.0, 107.5], [94.0, 105.0], [96.0, 106.0], [101.0, 111.0], [107.0, 111.0], [119.0, 110.0], [10.0, 107.0], [15.0, 117.0], [1.0, 5121.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 119.0, "title": "Response Time Vs Request"}},
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
    data: {"result": {"minY": 104.0, "minX": 1.0, "maxY": 5121.0, "series": [{"data": [[2.0, 5102.5], [44.0, 106.0], [3.0, 5104.0], [50.0, 114.0], [55.0, 105.0], [56.0, 105.0], [61.0, 107.0], [62.0, 106.5], [65.0, 104.0], [66.0, 106.0], [67.0, 107.5], [71.0, 105.0], [69.0, 104.0], [74.0, 106.5], [75.0, 107.0], [73.0, 106.0], [78.0, 115.5], [77.0, 107.0], [83.0, 107.0], [80.0, 106.0], [85.0, 105.0], [89.0, 107.0], [92.0, 107.0], [94.0, 105.0], [96.0, 106.0], [101.0, 111.0], [107.0, 111.0], [119.0, 110.0], [10.0, 106.5], [15.0, 117.0], [1.0, 5121.0]], "isOverall": false, "label": "Successes", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 119.0, "title": "Latencies Vs Request"}},
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
        data: {"result": {"minY": 1.4166666666666667, "minX": 1.7772813E12, "maxY": 34.45, "series": [{"data": [[1.77728136E12, 34.45], [1.7772813E12, 1.4166666666666667]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728136E12, "title": "Hits Per Second"}},
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
        data: {"result": {"minY": 1.25, "minX": 1.7772813E12, "maxY": 34.61666666666667, "series": [{"data": [[1.77728136E12, 34.61666666666667], [1.7772813E12, 1.25]], "isOverall": false, "label": "200", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.77728136E12, "title": "Codes Per Second"}},
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
        data: {"result": {"minY": 1.25, "minX": 1.7772813E12, "maxY": 34.61666666666667, "series": [{"data": [[1.77728136E12, 34.61666666666667], [1.7772813E12, 1.25]], "isOverall": false, "label": "GET /api/community/posts-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728136E12, "title": "Transactions Per Second"}},
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
        data: {"result": {"minY": 1.25, "minX": 1.7772813E12, "maxY": 34.61666666666667, "series": [{"data": [[1.77728136E12, 34.61666666666667], [1.7772813E12, 1.25]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.77728136E12, "title": "Total Transactions Per Second"}},
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

