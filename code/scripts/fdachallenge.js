var apikey = "z0wwT73I3DtNL8cxr3VUc7shQsESx0MPIyuTYQv9";
var apirooturl = "https://api.fda.gov/drug/event.json?api_key=" + apikey + "&search=";

var activeBars = {};

var tier2chart = "";
var myBarChart = ""; //setting a global variable so we can access our chart from any function
var defChart1 = "", defChart2 = "";

var keyWL = ["safetyreportid", "reactionmeddrapt", "patientweight", "drugcharacterization", "medicinalproduct","drugdosagetext", "patientonsetage", "patientsex", "route", "pharm_class_epc", "generic_name"];

var keyWLDataColumns = [    
    { "title": "safetyreportid", "defaultContent": "" },
    { "title": "reactionmeddrapt", "defaultContent": "" },
    { "title": "patientweight", "defaultContent": "" },
    { "title": "drugcharacterization", "defaultContent": "" },
    { "title": "medicinalproduct", "defaultContent": "" },
    { "title": "drugdosagetext", "defaultContent": "" },
    { "title": "patientonsetage", "defaultContent": "" },
    { "title": "patientsex", "defaultContent": "" },
    { "title": "route", "defaultContent": "" },
    { "title": "pharm_class_epc", "defaultContent": "" },
    { "title": "generic_name", "defaultContent": "" }
];

$(document).ready(function () {
    //on page load
    //instantiate tool tips
    $("[data-toggle='tooltip']").tooltip();
    
    //load default analysis chart
    loadFrontPageChart();
    
    $('#chartdiv').hide();

    //enable the search button
    $('#btnApplySearch').click(function () {


        $('#defaultdiv').hide();
        $('#chartdiv').show();
        

        try {
            myBarChart.clear();
            myBarChart.destroy();
        } catch (e) { }


        if (!$('#startDate').val().match(/^$/) && !$('#endDate').val().match(/^$/)) {
            getEventsByDate($('#startDate').val(), $('#endDate').val(), $('#iDrug').val(), $('#selreaction').val(), $('#subname').val());
        } else {
            AlertDialog("Required Field", "Please supply a start and end date for your search. :-)");
        }

    });

    //enable the search button
    $('#btnApplyTier2').click(function () {

        try {
            tier2chart.clear();
            tier2chart.destroy();
        } catch (e) { }

        getTier2Data($('#selectedDate').val(), $('#iDrug').val(), $('#selreaction').val(), $('#subname').val());
        

    });

    //enable chart canvas to watch for user clicks
    $('#chartTarg').click(function (evt) {
        

        try {
            activeBars = myBarChart.getBarsAtEvent(evt);
        } catch (e) {
        }

        //console.log(activeBars);

        if (activeBars.length > 0) {
            // alert('congrats! You chose ' + activeBars[0].label + ' (' + activeBars[0].value + ' occurrences)\ncheck out what we logged in the console for the details on what is available during a chart click');
            // => activeBars is an array of bars on the canvas that are at the same position as the click event.

            $("#tier2modal").modal();
        }

    });

    //enable the clear button
    $('#btnClearSearch').click(function () {
        //clear the search terms
        $('#iDrug').val('');
        $('#startDate').val('2010-01-01');
        $('#endDate').val('2010-01-31');
        //hide the search results select list
        hideResultsRow();
        // if (typeof myBarChart.destroy === 'function') {  };
        try {
            myBarChart.clear();
            myBarChart.destroy();
        } catch (e) { }

        $("#charttitle").text("");
        $("#charttitlenote").text("");
    });

    //enable the build graph button
    $('#btnBuildGraph').click(function () {
        getSpecificItemData($('#selSpecificProducts').val());
    });
    
    ///MODAL FUNCTIONS

    $("#tier2modal").on('shown.bs.modal', function () {

        $("#tier2modalhead").text(activeBars[0].toolTipLabel);
        $("#selectedDate").val(activeBars[0].label);

        getTier2DataRaw($('#selectedDate').val(), $('#iDrug').val(), $('#selreaction').val(), $('#subname').val());

       
       
    });

    $("#tier2modal").on('hidden.bs.modal', function () {

        $('input[name=ChartType]').each(function(){
            $(this).prop('checked', false);
        });

        try {
            tier2chart.clear();
            tier2chart.destroy();
        } catch (e) { }

    });



});
	

function popResultsSelect(products){
	//clear the select's current options
	$('#selSpecificProducts > option').remove();
	//console.log(products);
	//build new options
	$(products).each( function(key,value){
		$('#selSpecificProducts')
			.append($("<option></option>")
         	.attr("value",value.term)
         	.text(value.term));
	});
}

function populateReactionSelect(reactions) {

    var persistSel = "";

    if ($('#selreaction').val() != null && $('#selreaction').val() != "") {
        persistSel = $('#selreaction').val();
    }
    //clear the select's current options
    $('#selreaction > option').remove();
    //console.log(products);
    //build new options
    $('#selreaction')
           .append($("<option></option>")
           .attr("value", "")
           .text("(ALL)"));

    $(reactions).each(function (key, value) {
        $('#selreaction')
			.append($("<option></option>")
         	.attr("value", value.term)
         	.text(value.term));
    });

    $('#selreaction').val(persistSel);

}

function getDrugNames(drugname){
	var targurl = apirooturl + "generic_name:" + drugname + "&count=patient.drug.openfda.brand_name.exact";
	//targurl = apirooturl + "generic_name:" + drugname + "&limit=50";
	console.log('url to get generic item list:' + targurl);
	$.get(targurl,function(data) {
	        //console.log(data);
			if(data.error){//this doesn't work. will need to do error checking another way, probably leveraging the xhr object which has sweet methods like 'fail', etc.
				alert(data.error.message);
				return;
			}
			popResultsSelect(data.results);
			showResultsRow();
	    }, "json" );
}

function getEventsByDate(startdate, enddate, drugname,reactionname,substancename) {

    var drugs = "";
    var reaction = "";
    var substance = "";

    drugname = drugname.toUpperCase();
    substancename = substancename.toUpperCase();

    if (!drugname.match(/^$/)) {
        drugs = "(generic_name:" + drugname + ")+AND+";
    }

    if (!substancename.match(/^$/)) {
        substance = "(substance_name:" + substancename.toUpperCase() + ")+AND+";
    }

    if (reactionname!=null && !reactionname.match(/^$/)) {
        reaction = "(patient.reaction.reactionmeddrapt:" + reactionname + ")+AND+";
    }

    var targurl = apirooturl + drugs + reaction + substance + "receivedate:[" + startdate + "+TO+" + enddate + "]";

    $.ajaxSetup({
        error: function (x, e) {

            if (x.status == 0) {
                AlertDialog('Error!', ' Check Your Network.');
            }
            else if (x.status == 404) {
                AlertDialog('Error!', 'No Data Found.  Please refine your search parameters and try again.');

            } else if (x.status == 500) {
                AlertDialog('Error!', 'Internal Server Error.');
            } else {
                AlertDialog('Error!', 'Unknown Error.\n' + x.responseText);
            }
        }
    });

    $.get(targurl + "&count=receivedate", function (data) { drawGraph(data.results); }, "json");

    $.get(targurl + "&count=patient.reaction.reactionmeddrapt.exact", function (data) { populateReactionSelect(data.results); }, "json");

    $("#charttitle").text(reactionname + " reactions for " + ((drugname + substancename == "") ? "ALL DRUGS" : drugname + " " + substancename) + " between " + startdate + " thru " + enddate);
    $("#charttitlenote").text("NOTE: data spikes are in red");

    console.log(targurl + "&count=receivedate");
}

function getTier2Data(selectedDate, drugname, reactionname, substancename) {

    var charttype = $('input[name=ChartType]:checked').val();
    var qry = buildtier2Query(selectedDate, drugname, reactionname, substancename);

    $.ajaxSetup({
        error: function (x, e) {

            if (x.status == 0) {
                AlertDialog('Error!', ' Check Your Network.');
            }
            else if (x.status == 404) {
                AlertDialog('Error!', 'No Data Found.  Please refine your search parameters and try again.');

            } else if (x.status == 500) {
                AlertDialog('Error!', 'Internel Server Error.');
            } else {
                AlertDialog('Error!', 'Unknow Error.\n' + x.responseText);
            }
        }
    });

    $.get(qry + "&count=" + charttype, function (data) { drawTier2Graph(data.results, $('input[name=ChartType]:checked').attr("id")); }, "json");

    console.log(qry + "&count=" + charttype);

}

function getTier2DataRaw(selectedDate, drugname, reactionname, substancename) {

    var qry = buildtier2Query(selectedDate, drugname, reactionname, substancename);

    $.ajaxSetup({
        error: function (x, e) {

            if (x.status == 0) {
                AlertDialog('Error!', ' Check Your Network.');
            }
            else if (x.status == 404) {
                AlertDialog('Error!', 'No Data Found.  Please refine your search parameters and try again.');

            } else if (x.status == 500) {
                AlertDialog('Error!', 'Internel Server Error.');
            } else {
                AlertDialog('Error!', 'Unknow Error.\n' + x.responseText);
            }
        }
    });

    $.get(qry + "&limit=100", function (data) { createDTSDataSet(data.results); }, "json");

    console.log(qry + "&limit=100");
}

function buildtier2Query(selectedDate, drugname, reactionname, substancename){

    var sDate = "";
    var drugs = "";
    var reaction = "";
    var substance = "";

    sDate = FDADate(selectedDate);

    if (!drugname.match(/^$/)) {
        drugs = "(generic_name:" + drugname + ")+AND+";
    }

    if (!substancename.match(/^$/)) {
        substance = "(substance_name:" + substancename + ")+AND+";
    }

    if (reactionname != null && !reactionname.match(/^$/)) {
        reaction = "(patient.reaction.reactionmeddrapt:" + reactionname + ")+AND+";
    }

    return apirooturl + drugs + reaction + substance + "receivedate:" + sDate;
}

function getSpecificItemData(target){
	//console.log('going after this target: ' + target);
	var targurl = apirooturl + "patient.drug.openfda.brand_name:" + target + "&limit=50&count=patient.reaction.reactionmeddrapt.exact";
	//targurl = apirooturl + "generic_name:" + drugname + "&limit=50";
	console.log('url to get specific item reaction data:' + targurl);
	$.get(targurl,function(data) {
	        //console.log(data.results);
			drawGraph(data.results);
	    }, "json" );
}

function fixUpFDAData(incoming) {
    var avgVal = 0;

    $(incoming).each(function (key, value) {       
        avgVal += value.count;
    });
    avgVal = Math.round( avgVal / $(incoming).length ); 

    var retval = {
        toolTipLabels: [],
		labels:[],
		datasets:[
			{
				label:"data",
	            fillColor: "rgba(153,255,153,0.5)",
	            strokeColor: "rgba(153,255,153,0.8)",
	            highlightFill: "rgba(153,255,153,0.75)",
	            highlightStroke: "rgba(153,255,153,1)",
	            data: []
			},
            {
				label:"spikes",
				fillColor: "rgba(255,51,51,0.5)",
				strokeColor: "rgba(255,51,51,0.8)",
				highlightFill: "rgba(255,51,51,0.75)",
				highlightStroke: "rgba(255,51,51,1)",
	            data: []
			}
		]
	    };

	    $(incoming).each(function (key, value) {

	        retval.labels.push((value.term == undefined ? formatDate(value.time) : value.term));
	        retval.toolTipLabels.push((value.term == undefined ? (value.count + " reactions on " + formatDate(value.time) + " ") : value.term));
	        //( " + Math.round((value.count / avgVal) * 100).toString() + "% of the average " + avgVal.toString() + " for the period " + formatDate($('#startDate').val()) + " TO " + formatDate($('#endDate').val()) + ") 
	        
	        if( parseInt($('#spikepct').val()) > 0  ){
	            if (((value.count / avgVal) * 100) >= (parseInt($('#spikepct').val()) + 100) ) {
	                retval.datasets[1].data.push(value.count);
	            } else {
	                retval.datasets[1].data.push(0);
	            }
	        }

	        if (!$('#toggleSpikes')[0].checked) {
	            retval.datasets[0].data.push(value.count);
	        } else {
	            retval.datasets[0].data.push(0);
	        }

	    });
	return retval;
}

function fixUpFDADataTier2(incoming,dsType) {
   
    var retval = {
        toolTipLabels: [],
        labels: [],
        datasets: [
			{
			    label: "data",
			    fillColor: "rgba(153,255,153,0.5)",
			    strokeColor: "rgba(153,255,153,0.8)",
			    highlightFill: "rgba(153,255,153,0.75)",
			    highlightStroke: "rgba(153,255,153,1)",
			    data: []
			}
        ]
    };
    

    /* 20150624 sort routine added by DVS */
    if (incoming && incoming.length > 1) {
        if (dsType === "WEIGHT" || dsType === "WEIGHT_KG" || dsType === "AGE") {
            incoming = incoming.sort(function (a, b) {
                //Sort asc
                return (a.term > b.term) ? 1 : ((a.term < b.term) ? -1 : 0);
            });

            //Next step added 20150625 by DVS -- group items
            if (incoming.length > 5) {
                incoming = bundleDataByType(incoming, dsType);
                dsType = "BUNDLED_" + dsType;
            }
        }
    }


    $(incoming).each(function (key, value) {
      
        if (dsType == "SEX") {

            retval.labels.push(value.term.toString().replace("0","Unknown").replace("1","Male").replace("2","Female") );
            retval.toolTipLabels.push(value.term.toString().replace("0", "Unknown").replace("1", "Male").replace("2", "Female"));
            retval.datasets[0].data.push(value.count);

        } else if (dsType == "WEIGHT") {

            retval.labels.push(Math.round( parseFloat( value.term) * 2.20462  ));  //Converting kilograms to pounds; we probably should make this an option, as many researchers would likely prefer kilos
            retval.toolTipLabels.push(Math.round(parseFloat(value.term) * 2.20462));
            retval.datasets[0].data.push(value.count);

        } else if (dsType == "DRUGROLE") {

            retval.labels.push(value.term.toString().replace("1", "Suspect drug").replace("2", "Concomitant drug").replace("3", "Interacting drug"));
            retval.toolTipLabels.push(value.term.toString().replace("1", "Suspect drug").replace("2", "Concomitant drug").replace("3", "Interacting drug"));
            retval.datasets[0].data.push(value.count);

        } else {

            retval.labels.push(value.term);
            retval.toolTipLabels.push(value.term);
            retval.datasets[0].data.push(value.count);

        }

    });

    return retval;
}

function formatDate(dval) {


    var day = dval.replace(/-/ig, "").substr(6, 2).toString();
    var month = dval.replace(/-/ig, "").substr(4, 2).toString();
    var year = dval.replace(/-/ig, "").substr(0, 4).toString();


    return month.toString() + "-" + day.toString() + "-" + year.toString();
}

function FDADate(dval) {

    var day = dval.split("-")[1];
    var month = dval.split("-")[0];
    var year = dval.split("-")[2];

    return year+month+day;
}

function drawGraph(dater){
	var data = fixUpFDAData(dater);
    
	//console.log(data);
	var options = {
	    //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
	    scaleBeginAtZero: true,

	    //Boolean - Whether grid lines are shown across the chart
	    scaleShowGridLines: false,

	    //String - Colour of the grid lines
	    scaleGridLineColor: "rgba(0,0,0,.2)",

	    // String - Colour of the scale line
	    scaleLineColor: "rgba(255,255,255,1.0)",

	    // String - Scale label font colour
	    scaleFontColor: "#fff",

	    // Number - Scale label font size in pixels
	    scaleFontSize: 14,

	    // String - Scale label font weight style
	    scaleFontStyle: "normal",

	    //Number - Width of the grid lines
	    scaleGridLineWidth: 1,

	    //Boolean - Whether to show horizontal lines (except X axis)
	    scaleShowHorizontalLines: true,

	    //Boolean - Whether to show vertical lines (except Y axis)
	    scaleShowVerticalLines: true,

	    //Boolean - If there is a stroke on each bar
	    barShowStroke: true,

	    //Number - Pixel width of the bar stroke
	    barStrokeWidth: 5,

	    //Number - Spacing between each of the X value sets
	    barValueSpacing: 5,

	    //Number - Spacing between data sets within X values
	    barDatasetSpacing: -10,

	    //String - A legend template
	    legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
	}


    //setup chart
	$("#chartTarg").css("width", (parseInt(data.labels.length) * 20).toString() + "px");
	$("#chartTarg").css("height","540px");
    //instantiate our chart canvas
	myBarChart = new Chart($("#chartTarg").get(0).getContext("2d")).Bar(data, options);
}

function drawTier2Graph(dater,dsType) {
    var data = fixUpFDADataTier2(dater, dsType);


    //console.log(data);
    var options = {
        //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
        scaleBeginAtZero: true,

        //Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: false,

        //String - Colour of the grid lines
        scaleGridLineColor: "rgba(0,0,0,.2)",

        // String - Colour of the scale line
        scaleLineColor: "rgba(255,255,255,1.0)",


        // String - Scale label font colour
        scaleFontColor: "#fff",

        // Number - Scale label font size in pixels
        scaleFontSize: 14,

        // String - Scale label font weight style
        scaleFontStyle: "normal",

        //Number - Width of the grid lines
        scaleGridLineWidth: 1,

        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,

        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,

        //Boolean - If there is a stroke on each bar
        barShowStroke: true,

        //Number - Pixel width of the bar stroke
        barStrokeWidth: 5,

        //Number - Spacing between each of the X value sets
        barValueSpacing: 5,

        //Number - Spacing between data sets within X values
        barDatasetSpacing: -3,

        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    }


    //setup chart
    $("#tier2chart").css("width", (parseInt(data.labels.length) * 20).toString() + "px");
    $("#tier2chart").css("height", "600px");
    //instantiate our chart canvas
    tier2chart = new Chart($("#tier2chart").get(0).getContext("2d")).Bar(data, options);
}

function createDTSDataSet(dset) {
    //wordlist of properties on the data record to retrieve.  Must be in the iorder that they appear on the record
    
    var retDset = [];
    
    $(dset).each(function (k, v) {

        var retRow = Array(13).join(".").split(".");


        try { retRow[0] = v[keyWL[0]]; } catch (e) { retRow[0] = ""; }                                //"safetyreportid",   
            
        $(v["patient"]["reaction"]).each(function (kEy, vAl) {  //"reactionmeddrapt"];
            retRow[1] += vAl[keyWL[1]] + ',';
        });   
            
        try {  retRow[2] = v["patient"][keyWL[2]];   } catch (e) { retRow[2] = ""; }      //  "patientweight"];
        try { retRow[7] = v["patient"][keyWL[7]];  } catch (e) { retRow[7] = ""; }          // "patientsex"];

        try { retRow[6] = v["patient"][keyWL[6]]; } catch (e) { retRow[6] = ""; } //  "patientonsetage"];

        $(v["patient"]["drug"]).each(function (kEy, vAl) {  


            try { retRow[3] += vAl[keyWL[4]] + ":" + vAl[keyWL[3]] + ','; } catch (e) { retRow[3] = "";}          // "drugcharacterization"];
            try { retRow[4] += vAl[keyWL[4]] + ','; } catch (e) { retRow[4] = ""; }           //  "medicinalproduct"];
            try {

                retRow[5] += ($.isArray(vAl[keyWL[5]])) ? vAl[keyWL[5]].join(',') : (( vAl[keyWL[5]] != undefined ) ? vAl[keyWL[5]] : "" ) ;

            } catch (e) {
                retRow[5] = "";
            }
            //  "drugdosagetext"];
            try { retRow[8] += vAl["openfda"][keyWL[8]].join(',') + ','; } catch (e) { retRow[8] = ""; }           //  "route"];
            try { retRow[10] += vAl["openfda"][keyWL[10]].join(',') + ','; } catch (e) { retRow[10] = ""; }         //  "generic_name"];
            try { retRow[9] += vAl["openfda"][keyWL[9]].join(',') + ','; } catch (e) { retRow[9] = ""; }               // "pharm_class_epc"];


        });

        retDset.push(retRow);          
    });
       

    $('#tblcontainer').html('<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered" id="example" ></table>');

    $('#example').dataTable({
        "data": retDset,
        "columns": keyWLDataColumns,
        "pageLength": 3,
        "paging": true,
        "lengthChange": true,
        "lengthMenu": [1,3,5],
        "scrollX": true,
        "oLanguage": {
            "sSearch": "Filter Terms:",
            "sZeroRecords": "There are no records that match your search criteria",
            "sLengthMenu": '_MENU_'
			},
        "fnInitComplete": function () {
            $('.dtlength label').prepend("Number of Records to Display:&nbsp;&nbsp;");
			$('.btnExportGrid').append(
				$('<button></button>')
				.text('Export Table Data')
				.on('click',function(){
					JSONToCSVConvertor(prepTableDataForExport($('#example').dataTable().api().data(),keyWLDataColumns), $('#tier2modalhead').text(), true);
				})
			);
        },	
		"sDom": "<'btnExportGrid'><'clear'><'box-content'<'col-sm-3'f><'col-sm-9 text-right dtlength'l><'clearfix'>>rt<'box-content'<'col-sm-6'i><'col-sm-6 text-right'p><'clearfix'>>"
    });
}

function prepTableDataForExport(dater,colnames){
	var retval = [];
	//for each item in the incoming dater, create array of objects, replacing the numeric key with the appropriate textual key
	$(dater).each(function(index,childarray){
		//loop over the child array
		var thisobj = {};
		$(childarray).each(function(i,val){
			//setting the key by looking up the corresponding column name in the columns array
		    try {
		        thisobj[colnames[i].sTitle] = val;
		    } catch (e) {
		    }
		});
		retval.push(thisobj);
	});
	return retval;
}

function listAllProperties(o) {

    var objectToInspect;
    var result = [];

    for (objectToInspect = o; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)) {
        result = result.concat(Object.getOwnPropertyNames(objectToInspect));
    }
    return result;
}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    
    var CSV = '';    
    //Set Report title in first row or line
    
    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);
        
        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {        
        alert("Invalid data");
        return;
    }   
    
    //Generate a file name
    var fileName = "MyReport_";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    
    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    
    
    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");    
    link.href = uri;
    
    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function loadFrontPageChart() {
    //this function runs the logic to build the most recent data spike preview for the front page
    // we use a 50% threshold for the data spike detection logic.

    var startdate = "2014-01-01";
    var enddate = "2014-06-03";
    var dataspike = { date: "", count: 0 };   
    var targurl = ""
    var retdata = [];
    var sexdata = [];
    var agedata = [];
    
    var sextext = " Affecting both sexes ";
    var agetext = " and all age groups ";

    $.ajaxSetup({ // ajax error setup
        error: function (x, e) {
            if (x.status == 0) {
                AlertDialog('Error!', 'Cannot access FDA Data Web Service. Please Check Your Network Settings and Internet Availability.');
            }
            else if (x.status == 404) {
                AlertDialog('Error!', 'No Data Found.  Please refine your search parameters and try again.');
            } else if (x.status == 500) {
                AlertDialog('Error!', 'Internel Server Error.');
            } else {
                AlertDialog('Error!', 'Unknow Error.\n' + x.responseText);
            }
        }
    });

    targurl = apirooturl + "receivedate:[" + startdate + "+TO+" + enddate + "]&count=receivedate";    

    //get all results for the last 6 months and find the most recent data spike of 50% or more.
    $.get(targurl, function (data) {
        dataspike = mostRecentDataSpike(data.results);

            //find the most affected gender, if no primary gender is affected then we say both, which is 0.  male = 1, female = 2
            //the criteria for determining a primary affected sex group would be a group that is double of what other groups are.
            targurl = apirooturl + "receivedate:" + dataspike.date + "&count=patient.patientsex";

            $.get(targurl, function (data) {
                
                $(data.results).each(function (key, value) {
                    if (sexdata.length == 0 && value.term != 0) {
                        sexdata = [{ sex: value.term, count: value.count }];
                    } else if (value.count >= (sexdata[0].count * 2) && value.term != 0) {
                        sextext = " primarily affecting " + (value.term == 1 ? "Males " : "Females ");
                        sexdata = [{ sex: value.term, count: value.count }];
                    } else if (value.term != 0) {
                        sexdata = [{ sex: sexdata[0].sex, count: sexdata[0].count }, { sex: value.term, count: value.count }];
                    }
                });

                //find the most affected age group, if no primary age group is affected then we include the top 2,3,4,etc. age groups.
                //the criteria for determining an affected age group would be a group that is double of what other groups are.
                targurl = apirooturl + "receivedate:" + dataspike.date + "&count=patient.patientonsetage";

                $.get(targurl, function (data) {

                    // sort routine added by DVS 
                    var aged = data.results.sort(function (a, b) {
                        //Sort asc
                        return (a.term > b.term) ? 1 : ((a.term < b.term) ? -1 : 0);
                    });

                    // group items
                    if (aged.length > 5) {
                        aged = bundleDataByType(aged, "AGE");
                    }

                    //loop through the age brackets and see if the top two age brackets deviate by more than 50%, if so then there is a 
                    //dominant age bracket. Else don't specify a dominant age bracket.

                    var topage = {term:"",count:0};
                    var top2age = { term: "", count: 0 };

                    $(aged).each(function (key, value) {
                        if (topage.count == 0) {
                            topage.count = value.count;
                            topage.term = value.term;
                        } else {
                            if (top2age.count == 0) {
                                top2age.count = value.count;
                                top2age.term = value.term;
                            } else {
                                if (value.count > topage.count) {
                                    top2age = topage;
                                    topage.count = value.count;
                                    topage.term = value.term;
                                }
                            }
                        }
                    });

                    if (topage.count >= (top2age.count * 2)) {
                        agedata = topage;
                        agetext = " and the " + topage.term + " age group ";
                    } else {
                        agedata = aged;
                    }


                    // datasets for chart
                    var retval1 = {
                        toolTipLabels: [],
                        labels: [],
                        datasets: [
                            {
                                label: "data",
                                fillColor: "rgba(153,255,153,0.5)",
                                strokeColor: "rgba(153,255,153,0.8)",
                                highlightFill: "rgba(153,255,153,0.75)",
                                highlightStroke: "rgba(153,255,153,1)",
                                data: []
                            }
                        ]
                    };

                    // datasets for chart
                    var retval2 = {
                        toolTipLabels: [],
                        labels: [],
                        datasets: [
                            {
                                label: "data",
                                fillColor: "rgba(153,255,153,0.5)",
                                strokeColor: "rgba(153,255,153,0.8)",
                                highlightFill: "rgba(153,255,153,0.75)",
                                highlightStroke: "rgba(153,255,153,1)",
                                data: []
                            }
                        ]
                    };

                    $(agedata).each(function (key, value) {
                        retval1.labels.push(value.term);
                        retval1.toolTipLabels.push(value.term + " : " + value.count);
                        retval1.datasets[0].data.push(value.count);
                    });

                    $(sexdata).each(function (key, value) {
                        var s = (value.sex == 1 ? "Male" : "Female");
                        retval2.labels.push(s);
                        retval2.toolTipLabels.push(s + " : " + value.count);
                        retval2.datasets[0].data.push(value.count);
                    });

                    drawDefaultGraph(retval1, retval2);


                    targurl = apirooturl + "receivedate:" + dataspike.date + "&count=patient.drug.openfda.substance_name.exact";
                    $.get(targurl, function (data) {

                    var substancedata = [];
                    var sub_total = 0;
                    var substances = "";

                        $(data.results).each(function (key, value) {
                            if(key==0){
                                substances += "" + value.term + "";
                                sub_total = value.count;
                            }
                        });
                        
                                                
                        targurl = "https://api.fda.gov/drug/enforcement.json?api_key="+apikey+"&search=(openfda.substance_name:\""+substances+"\")+AND+report_date:["+startdate+"+TO+"+enddate+"]";
                        $.get(targurl, function (data) {


                            $(data.results).each(function (key, value) {
                                if (value["openfda"]["substance_name"].join().indexOf(substances) > -1) {
                                    substances = " The most prominent substances involved in the reaction spike is " + substances + " with " + sub_total + " reactions.  " + substances +
                                        " has had a recent recall on " + formatDate(value.report_date);
                                    $("#defPanel").text("The latest data spike is shown above for the date " + formatDate(dataspike.date) + ". " + sextext + agetext + ". " + substances);
                                }
                            });
                            

                        }, "json");
                    }, "json");
                }, "json");
            }, "json");
    }, "json");


}

function drawDefaultGraph(data1,data2) {

    var options = {
        scaleBeginAtZero: true,
        scaleShowGridLines: false,      
        scaleGridLineColor: "rgba(0,0,0,.2)",
        scaleLineColor: "rgba(255,255,255,1.0)",
        scaleFontColor: "#fff",
        scaleFontSize: 14,
        scaleFontStyle: "normal",
        scaleGridLineWidth: 1,
        scaleShowHorizontalLines: true,
        scaleShowVerticalLines: true,
        barShowStroke: true,
        barStrokeWidth: 5,
        barValueSpacing: 5,
        barDatasetSpacing: 10,
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    }

    //setup chart
    $("#chartTarg").css("width", "500px");
    $("#chartTarg").css("height", "250px");
    //instantiate our chart canvas
    defChart1 = new Chart($("#defChart1").get(0).getContext("2d")).Bar(data1, options);
    defChart2 = new Chart($("#defChart2").get(0).getContext("2d")).Bar(data2, options);
}

function mostRecentDataSpike(incoming) {

    //find most recent data spike in dataset provided range
    //for the front page purposes we work with a 50% spike threshold

    var avgVal = 0;
    var dataspike = { date: "", count: 0 };

    $(incoming).each(function (key, value) {
        avgVal += value.count;
    });

    avgVal = Math.round(avgVal / $(incoming).length);

    $(incoming).each(function (key, value) {
            if (((value.count / avgVal) * 100) >= (150)) {
                dataspike.date = value.time;
                dataspike.count = value.count;
            } 
    }); 

    return dataspike;
}


/* 
 *   makeEmptyBundles is a helper function, designed to create a collection of
 *                    empty cells intended to assist bundling (grouping) 
*                     data whose terms are best expressed as numbers.
 *                    For example, group ages by decades ("0-10","11-20", ... "81-90")
 *                                 or weights by 50 (pound) increments ("0-50","51-100", etc.)
 *   ------------------------------
 *   PARAMETERS
 *        maxMagnitude     --  int  :  the largest value in the sorted range
 *                                     to be bundled;  e.g. 83 or 83.6
 *        groupsOf         --  int  :  a divisor;  e.g. group by 10s, or 50s, or 100s...
 *   ------------------------------
 *   RETURNS
 *        A container array large enough to hold a range of values up to and including maxMagnitude.
 *        Cells in this array will contain these fields:
 *              term  :  a string label, e.g. "0-10", or "11-20", or "50-100"
 *             count  :  number of items that fall into this group; based on the
 *                       expectation that the source data to be sorted will have
 *                       its own count for more discrete, pre-bundled data units.
 *          component :  an empty array, intended to store copies of the original data
 *                       units to be bundled
 */
function makeEmptyBundles(maxMagnitude, groupsOf) {
    var bundled = [],
        maxCells = Math.ceil(maxMagnitude / groupsOf),  //e.g. group by decades, or by 50 lb increments, etc.
        index = 0,
        x = 0;

    while (x < maxCells) {
        var newItem = new Object();
        newItem.term = (x === 0) ? '0' : (((x * groupsOf) + 1) + '');
        newItem.term = newItem.term + '-' + (((x + 1) * groupsOf) + '');  //Now, label is a string range; e.g. "0-10", "11-20", etc.
        newItem.count = 0;
        newItem.component = [];

        bundled.push(newItem);
        x = x + 1;
    }

    return bundled;
}


function bundleData(sortedIn, groupsOf) {
    var bundled = [];
    var maxInput = Math.round(parseFloat(sortedIn[sortedIn.length - 1].term));
    var x = 0, magnitude = 0.0, index = 0, maxCells = 0;  //Initialization

    bundled = makeEmptyBundles(maxInput, groupsOf);

    //Having now defined the cells to store our bundles, now we need to aggregate
    $(sortedIn).each(function (key, value) {
        magnitude = Math.round(parseFloat(value.term));
        index = (magnitude < 1.0) ? 0 : Math.floor((magnitude - 1) / groupsOf);
        bundled[index].count += value.count;
        bundled[index].component.push(value);
    });

    return bundled;
}

function bundleDataByType(sortedIn, dsType) {

    if (dsType === "AGE") {
        return bundleData(sortedIn, 10);
    }

    if (dsType === "WEIGHT") {
        //Pounds
        return bundleData(sortedIn, 50);
    }

    if (dsType === "WEIGHT_KG") {
        //Pounds
        return bundleData(sortedIn, 50);
    }

    //Otherwise... just return the input
    return sortedIn;
}
