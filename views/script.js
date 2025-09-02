// Import the socket connection from the socket.js file
import { socket } from '/views/socket.js';

// Define an object that maps card values and suits to their corresponding names
const cardValuesW = {
  "-1": "spades",   // Suit: Spades
  "-2": "hearts",   // Suit: Hearts
  "-3": "clubs",    // Suit: Clubs
  "-4": "diamonds", // Suit: Diamonds
  "2": "2",         // Card: 2
  "3": "3",         // Card: 3
  "4": "4",         // Card: 4
  "5": "5",         // Card: 5
  "6": "6",         // Card: 6
  "7": "7",         // Card: 7
  "8": "8",         // Card: 8
  "9": "9",         // Card: 9
  "10": "10",       // Card: 10
  "11": "jack",     // Card: Jack
  "12": "queen",    // Card: Queen
  "13": "king",     // Card: King
  "14": "ace"       // Card: Ace
};

// Listen for the 'playerDisconnect' event from the server
socket.on('playerDisconnect', (player) => {
  // Log the disconnected player's name to the console
  console.log(`${player} disconnected (client)`);
});

/**
 * Function to display cards on the HTML page.
 * @param {Array|string} Cards - An array of card objects or the string 'back' to display card backs.
 * @param {string} handName - The name of the hand (e.g., 'player', 'opponent') to identify the HTML elements.
 */
function HTMLCardDisplay(Cards, handName) {
  // If Cards is 'back', display the back of the cards (hidden state)
  if (Cards === 'back') {
    for (let i = 0; i < 2; i++) {
      // Get the image element by its ID (e.g., 'player1', 'player2')
      let image = document.getElementById(`${handName}${i + 1}`);
      // Set the image source to the card back image
      image.src = `/views/Images/Playing Cards/PNG-cards-1.3/cardBack.png`;
    }
  } else {
    // If Cards is an array, display the actual cards
    for (let i = 0; i < Cards.length; i++) {
      // Get the image element by its ID (e.g., 'player1', 'player2')
      let image = document.getElementById(`${handName}${i + 1}`);
      // Set the image source to the corresponding card image using the cardValuesW mapping
      image.src = `/views/Images/Playing Cards/PNG-cards-1.3/${cardValuesW[Cards[i].v]}_of_${cardValuesW[Cards[i].s]}.png`;
      // Add the 'active' class to the image (for styling or interaction purposes)
      image.classList.add("active");
    }
  }
}

// Export the HTMLCardDisplay function and cardValuesW object for use in other files
export { HTMLCardDisplay, cardValuesW };