// Function to create a deck of cards
function deckCreate(deckArray) {
  // Loop through suits (represented by negative numbers)
  for (let s = -1; s > -5; s--) {
    // Loop through card values (2 to 14, where 11=J, 12=Q, 13=K, 14=A)
    for (let v = 2; v < 15; v++) {
      // Push a card object with value (v) and suit (s) into the deck array
      deckArray.push({ v, s });
    }
  }
}

// Function to display the cards in the deck
function cardDisplay(deckArray) {
  // Loop through each card in the deck array
  for (var card in deckArray) {
    // Log the card's value and suit using the cardValues mapping
    console.log(cardValues[deckArray[card].v] + cardValues[deckArray[card].s]);
  }
}

// Function to shuffle the deck
function shuffle(arr) {
  var i = arr.length, j, temp;
  // Loop through the array in reverse
  while (--i > 0) {
    // Pick a random index from the remaining unshuffled portion
    j = Math.floor(Math.random() * (i + 1));
    // Swap the current element with the randomly chosen one
    temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
  return arr; // Return the shuffled array
}

// Mapping of card values and suits to their corresponding symbols
const cardValues = {
  "-1": "♠️", // Spades
  "-2": "♥️", // Hearts
  "-3": "♣️", // Clubs
  "-4": "♦️", // Diamonds
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
  "11": "J", // Jack
  "12": "Q", // Queen
  "13": "K", // King
  "14": "A"  // Ace
};

// Export the functions and cardValues object for use in other modules
module.exports = {
  deckCreate,
  cardDisplay,
  shuffle,
  cardValues
};