var name = getName()
var individual_score = document.getElementById('individual_score');
var scoreboard = document.getElementById('scoreboard')

var specific_result = {}
$.getJSON( "scoreboard/data?name="+name, function( data ) {
    console.log(data)
    var specific_result = data
    individual_score.innerHTML = specific_result.name+" you are a mediocre worker. You only picked up "+specific_result.num_boxes+". You will never be a "+getOccupation()+"."
 });

$.getJSON( "scoreboard/data", function( data ) {
    console.log(data)
    var scoreboard_data = data

    scoreboard.innerHTML = "<h2>Leader Board</h2>"
    for(var i in scoreboard_data){
        scoreboard.innerHTML += "<p>"+scoreboard_data[i]["name"]+" "+scoreboard_data[i]["num_boxes"]+"</p>"
    }
 });
