function checkFields(input) {
    if(input=="name") {
        var name = document.getElementById('name').value
        document.cookie = "name="+name
        resetScreen()
    }
    else if(input=="occupation") {
        var occupation = document.getElementById("occupation").value

        document.cookie = "occupation="+occupation
        resetScreen()
    }
}

function showIntro(){
    var intro_content = document.getElementById("intro_content")
    document.cookie = "shown_intro=true"
    name = getName()
    occupation = getOccupation()
    intro_content.innerHTML = name+", you are 19. Two years ago World War 2 ended and \
         your country, occupied by the Nazis, was handed over to the influence of the USSR. \
        You were training to be a "+occupation+", but your father was a doctor, and the \
        children of the Bourgeoisie must do manual labor. You have been assigned to the cigarette \
        factory, where you will work for the rest of our life. The work is dull and you \
        despair. You cannot afford the airfare to Austria in order to defect. Your only \
        hope for a new job is to be so good at it that you become a <i>Hero of Labor</i>. \
        <input type='submit' value='Start Game' onclick='toNextScreen()'>"

}

function resetScreen() {
    window.location = window.origin
}

function toNextScreen() {
    window.location = window.origin+"/game"
}