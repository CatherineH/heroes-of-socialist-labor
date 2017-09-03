function max(input) {
    return Math.max( ...input )
}

function min(input) {
    return Math.min( ...input )
}

function getCookie(part){
    var name = document.cookie
    if(name.indexOf(part+"=") == -1){
        return false
    }
    name = name.substr(name.indexOf(part+"="))

    if(name.indexOf(";") >0) {
        name = name.substr(name.indexOf("=")+1, name.indexOf(";")-name.indexOf("=")-1)
    }
    else {
        name = name.substr(name.indexOf("=")+1, name.length-name.indexOf("=")-1)
    }
    return name
}

function getName(){
    return getCookie("name")
}

function getOccupation(){
    return getCookie("occupation")
}

function resetScreen() {
    window.location = window.origin
}