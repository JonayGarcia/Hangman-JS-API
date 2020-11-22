let OMDB_API_URL = null;

if (localStorage.getItem('OMDB_API_URL') === null) {
    OMDB_API_URL = "http://www.omdbapi.com/?apikey=bfba49dd&t=" + generateRandomLetter() + "&y=" + generateRandomYear(1990, 2020);
    localStorage.setItem('OMDB_API_URL', OMDB_API_URL);
} else {
    OMDB_API_URL = localStorage.getItem('OMDB_API_URL');
}

document.addEventListener("DOMContentLoaded", function(event) {
    fetch(OMDB_API_URL).then(response => response.json())
    .then(data => {
        let game = createGame(data);
        window.game = game; // this converts a local variable into global
        game.createListeners();
        game.writeHiddenWord();
    });
});

function generateRandomLetter() {
    let alphabetButtons = document.querySelectorAll('.game__alphabet button');

    return alphabetButtons[Math.floor(Math.random() * alphabetButtons.length)].innerText;
}

function generateRandomYear(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function createGame(data) {
    const word = loadVariableFromLocalStorage('storedWord', data.Title.toUpperCase());
    const maximumHints = 5;
    let hints = loadObjectFromLocalStorage('storedClues', [
        {"Director": data.Director},
        {"Actors": data.Actors},
        {"Year": data.Year},
        {"Genre": data.Genre},
        {"Country": data.Country}
    ]);
    let givenHints = loadVariableFromLocalStorage('givenHints', 0);
    let lives = loadVariableFromLocalStorage('storedLives', 6);
    let totalSeconds = loadVariableFromLocalStorage('storedTime', 180);
    let usedCharacters = loadObjectFromLocalStorage('usedCharacters', []);
    initTime(totalSeconds);
    let interval = setInterval(setTime, 1000);

    if (localStorage.getItem('currentHint') !== null) {
        let currentHint = JSON.parse(localStorage.getItem('currentHint'));
        for (key in currentHint) {
            document.querySelector('#clue').innerText = key + ": " + currentHint[key];
        }
    } else {
        document.querySelector('#clue').innerText = '-';
    }
    
    document.querySelector('#lives-counter').innerText = lives;
    document.querySelector('#image').setAttribute('src', '/images/hangman_' + lives + '.png');

    function loadVariableFromLocalStorage(key, defaultValue){
        if (localStorage.getItem(key) !== null) {
            return localStorage.getItem(key);
        }

        localStorage.setItem(key, defaultValue);
        return defaultValue;
    }

    function loadObjectFromLocalStorage(key, defaultValue){
        if (localStorage.getItem(key) !== null) {
            return JSON.parse(localStorage.getItem(key));
        }

        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
    }

    function initTime() {
        let minutesLabel = document.getElementById("minutes");
        let secondsLabel = document.getElementById("seconds");
        secondsLabel.innerHTML = padding(totalSeconds % 60);
        minutesLabel.innerHTML = padding(parseInt(totalSeconds / 60));
    }
    
    function setTime() {
        let minutesLabel = document.getElementById("minutes");
        let secondsLabel = document.getElementById("seconds");
        
        if (totalSeconds > 0){
            --totalSeconds;
            localStorage.setItem('storedTime', totalSeconds);
            secondsLabel.innerHTML = padding(totalSeconds % 60);
            minutesLabel.innerHTML = padding(parseInt(totalSeconds / 60));
        } else {
            gameOver();
        }
    }

    function padding(val) {
        let valString = val + "";

        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    }

    function getDisplay(character){
        if (usedCharacters.includes(character)) {
            return character;
        }
        const ourAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return  !ourAlphabet.includes(character) ? character : "__";
    }

    function writeHiddenWord() {
        let wordContainer = document.querySelector('#game__word');

        while (wordContainer.firstChild) {
            wordContainer.removeChild(wordContainer.lastChild);
        }

        for (let position in word) {
            let characterDiv = document.createElement("div"); 
            characterDiv.innerText = getDisplay(word[position]);
            characterDiv.classList.add('character');
            wordContainer.appendChild(characterDiv);
        }
    }

    function applyCharacter(character) {
        usedCharacters.push(character);
        localStorage.setItem('usedCharacters', JSON.stringify(usedCharacters));
        if (word.includes(character)){
            correctCharacter(character);
            if (allCharactersAreVisible()) victory();
        } else {
            wrongCharacter();
        } 
    }

    function correctCharacter(character){
        let characters = document.querySelectorAll('.character');
        
        for (let position = 0; position < word.length; position++) {
            if (word[position] == character){
                characters[position].innerText = character;
            }
        }
    }

    function allCharactersAreVisible() {
        let characters = document.querySelectorAll('.character');
        
        for (let position = 0; position < word.length; position++) {
            if (characters[position].innerText != word[position] && word[position] != ' '){
                return false;
            } 
        }
        
        return true;
    }
    
    function wrongCharacter() {
        decreaseLives();        
    }

    function getHint() {
        if (givenHints < maximumHints && lives > 0) {
            givenHints++;
            localStorage.setItem('givenHints', givenHints);
            decreaseLives();
            let index = Math.floor(Math.random() * hints.length);
            localStorage.setItem('currentHint', JSON.stringify(hints[index]));
            let currentHint = hints[index];
            for (key in currentHint) {
                document.querySelector('#clue').innerText = key + ": " + currentHint[key];
            }
            hints.splice(index, 1);
        }

        if (givenHints == maximumHints) {
            disableButton(document.querySelector('#hint-button'));
        }
    }

    function decreaseLives(){
        lives--;
        localStorage.setItem('storedLives', lives);
        document.querySelector('#lives-counter').innerText = lives;
        document.querySelector('#image').setAttribute('src', '/images/hangman_' + lives + '.png');
        if (lives <= 0) gameOver();
    }

    function victory() {
        let gamemessage = document.getElementById('game__message');
        gamemessage.innerText = "You win!";
        gamemessage.classList.add("game__message-win");

        document.getElementById('usedLives').innerText = "You have used " + (6 - lives) + " lives!";
        document.getElementById('usedHints').innerText = "You have used " + givenHints + " hints!";
        document.getElementById('usedTime').innerText = "You have used " + (180 - totalSeconds) + " seconds!";
        
        endGame();
    }
    
    function gameOver() {
        let gamemessage = document.getElementById('game__message');
        gamemessage.innerText = "You lose!";
        gamemessage.classList.add("game__message-lose");
        
        let gamesolution = document.getElementById('game__solution');
        gamesolution.innerText = "The movie was: ";
        gamesolution.classList.add("game__solution");

        let solution = document.getElementById('solution');
        console.log(solution);
        solution.innerText = data.Title;
        solution.classList.add("solution");
        
        endGame();
    }

    function endGame() {
        clearInterval(interval);
        removeListeners();
        localStorage.clear();
    }

    function removeListeners() {
        disableButton(document.querySelector('#hint-button'));
        let alphabetButtons = document.querySelectorAll('.game__alphabet button');
        alphabetButtons.forEach(button => {
            disableButton(button);
        });
    }

    function createListeners() {
        createAlphabetListeners();
        if (usedCharacters.length !== 0) {
            let alphabetButtons = document.querySelectorAll('.game__alphabet button');

            for (let position = 0; position < alphabetButtons.length; position++) {
                if (usedCharacters.includes(alphabetButtons[position].innerText)) {
                    disableButton(alphabetButtons[position]);
                }
            }
        }

        createHintListener();
        if (givenHints >= maximumHints) {
            disableButton(document.querySelector('#hint-button'));
        }

        createPlayAgainListener();
    }

    return {
        applyCharacter: applyCharacter,
        writeHiddenWord: writeHiddenWord,
        getHint: getHint,
        endGame: endGame,
        createListeners:createListeners
    };
}

function createAlphabetListeners(){
    let alphabetButtons = document.querySelectorAll('.game__alphabet button');
    alphabetButtons.forEach(button => {
        button.classList.remove('disabled');
        button.addEventListener('click', alphabetButtonClicked);
    });
}

function alphabetButtonClicked(event){
    let button = event.target;
    disableButton(button);
    game.applyCharacter(button.innerText);
}

function createHintListener() {
    let button = document.querySelector('#hint-button');
    button.classList.remove('disabled');
    button.addEventListener('click', hintButtonClicked);
}

function hintButtonClicked(event) {
    game.getHint();
}

function createPlayAgainListener() {
    let playAgainButton = document.querySelector('#playAgain-button');
    playAgainButton.addEventListener('click', playAgainButtonClicked);
}

function playAgainButtonClicked(event) {
    game.endGame();
    document.getElementById('game__message').innerText = "";
    document.getElementById('game__solution').innerText = "";
    document.getElementById('solution').innerText = "";
    

    let OMDB_API_URL = null;

    if (localStorage.getItem('OMDB_API_URL') === null) {
        OMDB_API_URL = "http://www.omdbapi.com/?apikey=bfba49dd&t=" + generateRandomLetter() + "&y=" + generateRandomYear(1990, 2020);
        localStorage.setItem('OMDB_API_URL', OMDB_API_URL);
    } else {
        OMDB_API_URL = localStorage.getItem('OMDB_API_URL');
    }

    fetch(OMDB_API_URL).then(response => response.json())
    .then(data => {
        let game = createGame(data);
        window.game = game; // this converts a local variable into global
        createAlphabetListeners();
        createHintListener();
        game.writeHiddenWord();
    });
}

function disableButton(button){
    button.classList.add('disabled');
    if (button.id == 'hint-button') {
        button.removeEventListener('click', hintButtonClicked);
    } else {
        button.removeEventListener('click', alphabetButtonClicked);
    }
}
