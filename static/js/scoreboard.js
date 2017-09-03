var name = getCookie("key")
var individual_score = document.getElementById('individual_score');
var scoreboard = document.getElementById('scoreboard')

var specific_result = {}
$.getJSON( "scoreboard/data?key="+name, function( data ) {
    console.log(data)
    var specific_result = data
    individual_score.innerHTML = specific_result.name+" you are a mediocre worker. You only packed "+specific_result.num_boxes+" boxes. You will never be a "+getOccupation()+"."
 });

$.getJSON( "scoreboard/data", function( data ) {
    console.log(data)
    var scoreboard_data = data

    scoreboard.innerHTML = "<h2>Leader Board</h2>"
    for(var i in scoreboard_data){
        scoreboard.innerHTML += "<p>"+scoreboard_data[i]["name"]+", who wanted to be a(n) "+scoreboard_data[i]["occupation"]+" got "+scoreboard_data[i]["best_boxes"]+" boxes</p>"
    }
 });
