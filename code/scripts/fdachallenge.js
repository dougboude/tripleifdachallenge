apikey = "z0wwT73I3DtNL8cxr3VUc7shQsESx0MPIyuTYQv9";
apirooturl = "https://api.fda.gov/drug/event.json?api_key=" + apikey + "&search=";
myBarChart = ""; //setting a global variable so we can access our chart from any function

$(document).ready(function(){//on page load, set up some crap
    //set up the datatable, with a customized header section
    $('#datatable-1').dataTable({
        "aaSorting": [[0, "asc"]],
        "sDom": "<'box-content'<'col-sm-6'f><'col-sm-6 text-right dtlength'l><'clearfix'>>rt<'box-content'<'col-sm-6'i><'col-sm-6 text-right'p><'clearfix'>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sSearch": "Type search phrase...",
            "sZeroRecords": "There are no records that match your search criteria",
            "sLengthMenu": '_MENU_'
        },
        "aoColumnDefs": [
            { 'bSortable': false, 'aTargets': [6] }
        ],
        "fnInitComplete": function () {
            $('.dtlength label').html("Number of Records to Display: " + $('.dtlength label').html());
        }
    });
	
	//instantiate tool tips
	$("[data-toggle='tooltip']").tooltip();
	
	//hide results row
	hideResultsRow();
	
	//enable the search button
	$('#btnApplySearch').click(function(){
		getDrugNames($('#iDrug').val());
	});
	
	//enable chart canvas to watch for user clicks
	$('#chartTarg').click(function(evt){
	    var activeBars = myBarChart.getBarsAtEvent(evt);
		console.log(activeBars);
		alert('congrats! You chose ' + activeBars[0].label + ' (' + activeBars[0].value + ' occurrences)\ncheck out what we logged in the console for the details on what is available during a chart click');
	    // => activeBars is an array of bars on the canvas that are at the same position as the click event.
	});
	//enable the clear button
	$('#btnClearSearch').click(function(){
		//clear the search terms
		$('#iDrug').val('');
		//hide the search results select list
		hideResultsRow();
		if(typeof myBarChart.destroy === 'function'){myBarChart.destroy();};
	});
	
	//enable the build graph button
	$('#btnBuildGraph').click(function(){
		getSpecificItemData($('#selSpecificProducts').val());
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

function fixUpFDAData(incoming){
	var retval = {
		labels:[],
		datasets:[
			{
				label:"bla",
	            fillColor: "rgba(220,220,220,0.5)",
	            strokeColor: "rgba(220,220,220,0.8)",
	            highlightFill: "rgba(220,220,220,0.75)",
	            highlightStroke: "rgba(220,220,220,1)",
	            data: []
			}
		]
		};
	$(incoming).each(function(key,value){
		retval.labels.push(value.term);
		retval.datasets[0].data.push(value.count);
	});
	return retval;
}

function drawGraph(dater){
	var data = fixUpFDAData(dater);


	//console.log(data);
	var options = {
    //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
    scaleBeginAtZero : true,

    //Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines : true,

    //String - Colour of the grid lines
    scaleGridLineColor : "rgba(0,0,0,.05)",

    //Number - Width of the grid lines
    scaleGridLineWidth : 1,

    //Boolean - Whether to show horizontal lines (except X axis)
    scaleShowHorizontalLines: true,

    //Boolean - Whether to show vertical lines (except Y axis)
    scaleShowVerticalLines: true,

    //Boolean - If there is a stroke on each bar
    barShowStroke : true,

    //Number - Pixel width of the bar stroke
    barStrokeWidth : 5,

    //Number - Spacing between each of the X value sets
    barValueSpacing : 5,

    //Number - Spacing between data sets within X values
    barDatasetSpacing : 1,

    //String - A legend template
    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

};
	//instantiate our chart canvas
	var ctx = $("#chartTarg").get(0).getContext("2d");
	myBarChart = new Chart(ctx).Bar(data,options);
	
}