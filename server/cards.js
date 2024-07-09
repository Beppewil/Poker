function deckCreate(deckArray){
  for (let s = -1; s > -5; s--) {
    for (let v = 2; v < 15; v++) {
      deckArray.push({v,s})
    }
  }
}

function cardDisplay(deckArray) {
  for (var card in deckArray) {
    console.log(cardValues[deckArray[card].v] + cardValues[deckArray[card].s])
  }
}

function shuffle(arr) {
  var i = arr.length, j, temp;
  while(--i > 0){
      j = Math.floor(Math.random()*(i+1));
      temp = arr[j];
      arr[j] = arr[i];
      arr[i] = temp;
  }
  return arr
}

const cardValues = {
    "-1" : "♠️",
    "-2" : "♥️",
    "-3" : "♣️",
    "-4" : "♦️",	
    "2":  "2",
    "3" : "3",
    "4" : "4",
    "5" : "5",
    "6" : "6",
    "7" : "7",
    "8" : "8",
    "9" : "9",
    "10" : "10",
    "11" : "J",
    "12" : "Q",
    "13" : "K",
    "14" : "A"	
}

//export {deckCreate, cardDisplay, shuffle, cardValues}

module.exports = {
  deckCreate, 
  cardDisplay, 
  shuffle, 
  cardValues
}