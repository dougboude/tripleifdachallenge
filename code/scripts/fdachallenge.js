var apikey = "z0wwT73I3DtNL8cxr3VUc7shQsESx0MPIyuTYQv9";
var apirooturl = "https://api.fda.gov/drug/event.json?api_key=" + apikey + "&search=";
var myBarChart = ""; //setting a global variable so we can access our chart from any function
var activeBars = {};
var tier2chart = "";
var keyWL = ["safetyreportid", "reactionmeddrapt", "patientweight", "drugcharacterization", "medicinalproduct",
    "drugdosagetext", "manufacturer_name", "brand_name", "route", "pharm_class_epc", "generic_name", "patientonsetage", "patientsex"];
var keyWLDataColumns = [    
    { "title": "safetyreportid"},
    { "title": "reactionmeddrapt" },
    { "title": "patientweight" },
    { "title": "drugcharacterization" },
    { "title": "medicinalproduct" },
    { "title": "drugdosagetext" },
    { "title": "manufacturer_name" },
    { "title": "brand_name" },
    { "title": "route" },
    { "title": "pharm_class_epc" },
    { "title": "generic_name" },
    { "title": "patientonsetage" },
    { "title": "patientsex" }
];

$(document).ready(function () {
    //on page load
    //instantiate tool tips
    $("[data-toggle='tooltip']").tooltip();

    //hide results row
    hideResultsRow();


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
        }else {
            if (!$('#iDrug').val().match(/^$/)) {
                getDrugNames($('#iDrug').val());
            }
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

        console.log(activeBars);

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

});
	
function hideResultsRow(){
	$('#dResultsRow').hide();
}

function showResultsRow(){
	$('#dResultsRow').show();
}

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

    if (!drugname.match(/^$/)) {
        drugs = "(generic_name:" + drugname + ")+AND+";
    }

    if (!substancename.match(/^$/)) {
        substance = "(substance_name:" + substancename + ")+AND+";
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
                AlertDialog('Error!', 'Internel Server Error.');
            } else {
                AlertDialog('Error!', 'Unknow Error.\n' + x.responseText);
            }
        }
    });

    $.get(targurl + "&count=receivedate", function (data) { drawGraph(data.results); }, "json");

    $.get(targurl + "&count=patient.reaction.reactionmeddrapt.exact", function (data) { populateReactionSelect(data.results); }, "json");

    $("#charttitle").text(reactionname + " reactions for " + drugname + " " + substancename + " between " + startdate + " thru " + enddate);

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
	        retval.toolTipLabels.push((value.term == undefined ? (value.count + " reactions on " + formatDate(value.time) + " ( " + Math.round((value.count / avgVal) * 100).toString() + "% of the average " + avgVal.toString() + " for the period " + formatDate($('#startDate').val()) + " TO " + formatDate($('#endDate').val()) + ") ") : value.term));
	        
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

    $(incoming).each(function (key, value) {
      
        if (dsType == "SEX") {

            retval.labels.push(value.term.toString().replace("0","Unknown").replace("1","Male").replace("2","Female") );
            retval.toolTipLabels.push(value.term.toString().replace("0", "Unknown").replace("1", "Male").replace("2", "Female"));
            retval.datasets[0].data.push(value.count);

        } else if (dsType == "WEIGHT") {

            retval.labels.push(Math.round( parseFloat( value.term) * 2.20462  ));
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
	    barDatasetSpacing: -3,

	    //String - A legend template
	    legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
	}


    //setup chart
	$("#chartTarg").css("width", (parseInt(data.labels.length) * 20).toString() + "px");
	$("#chartTarg").css("height","600px");
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
        var resM = listAllProperties(v);
        var retRow = Array(keyWL.length).join(".").split(".");
        $(resM).each(function (Memkey,memval) { 
            if (v[memval] != null && v[memval].toString() == "[object Object]") {
                var subresM = listAllProperties(v[memval]);
                $(subresM).each(function (mk, mv) {
                    if (keyWL.indexOf(mv) > -1) {
                        retRow[keyWL.indexOf(mv)] = (v[memval][mv].length < 1) ? " " : v[memval][mv] ;
                    }
                });
            }else if (keyWL.indexOf(memval)>-1) {
                retRow[keyWL.indexOf(memval)] = (v[memval].length < 1) ?  " " : v[memval] ; 
            }
        });
        retDset.push(retRow);          
    });

    console.log(retDset);


    //$("#tblcontainer").html('done. ');

    //var tableProgress = $("<table id='tblrawdata'><tr><th></th></tr><tr><td></td></tr></table>");

    //$("#tblcontainer").empty().append(tableProgress);


    //$('#tblrawdata').dataTable({
    //    "aaSorting": [[0, "asc"]],
    //    "sDom": "<'box-content'<'col-sm-6'f><'col-sm-6 text-right dtlength'l><'clearfix'>>rt<'box-content'<'col-sm-6'i><'col-sm-6 text-right'p><'clearfix'>>",
    //    "sPaginationType": "bootstrap",
    //    "oLanguage": {
    //        "sSearch": "Type search phrase...",
    //        "sZeroRecords": "There are no records that match your search criteria",
    //        "sLengthMenu": '_MENU_'
    //    },
    //    "aoColumnDefs": [
    //        { 'bSortable': false, 'aTargets': [6] }
    //    ],
    //    "fnInitComplete": function () {
    //        $('.dtlength label').html("Number of Records to Display: " + $('.dtlength label').html());
    //    }
    //});

    
    //$('#tblrawdata').dataTable({
    //    "columns": keyWLDataColumns,
    //    "data": retDset,
       
    //});


   

    $('#tblcontainer').html('<table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered" id="example" ></table>');

    $('#example').dataTable({
        "data": retDset,
        "columns": keyWLDataColumns
    });
    



}

function listAllProperties(o) {

    var objectToInspect;
    var result = [];

    for (objectToInspect = o; objectToInspect !== null; objectToInspect = Object.getPrototypeOf(objectToInspect)) {
        result = result.concat(Object.getOwnPropertyNames(objectToInspect));
    }

    return result;

}