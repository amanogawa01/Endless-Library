"use strict";

var room = document.getElementById("room");

var bookViewer = document.getElementById("book-viewer");
var closeBook = document.getElementById("close-book");

var bookTitle = document.getElementById("book-title");
var bookAddress = document.getElementById("book-address");
var bookText = document.getElementById("book-text");

var currentHexagon = "000000";

var vocabulary = null;


/*
 * Load vocabulary data.
 */

fetch("data/vocabulary.json")
    .then(function (response) {

        if (!response.ok) {
            throw new Error(
                "Could not load vocabulary.json"
            );
        }

        return response.json();
    })
    .then(function (data) {

        vocabulary = data;

        generateWalls();
    })
    .catch(function (error) {

        console.error(error);

        bookText.innerHTML =
            "<p>Could not load the library data.</p>";
    });


/*
 * Convert a string into a deterministic number.
 */

function createSeed(text) {

    var hash = 2166136261;

    for (var i = 0; i < text.length; i++) {

        hash ^= text.charCodeAt(i);

        hash +=
            (hash << 1) +
            (hash << 4) +
            (hash << 7) +
            (hash << 8) +
            (hash << 24);
    }

    return hash >>> 0;
}


/*
 * Create a deterministic pseudo-random
 * number generator from a seed.
 */

function createRandom(seed) {

    return function () {

        seed += 0x6D2B79F5;

        var value = seed;

        value = Math.imul(
            value ^ (value >>> 15),
            value | 1
        );

        value ^= value +
            Math.imul(
                value ^ (value >>> 7),
                value | 61
            );

        return (
            (value ^ (value >>> 14)) >>> 0
        ) / 4294967296;
    };
}


/*
 * Select an item from an array.
 */

function choose(random, array) {

    var index =
        Math.floor(random() * array.length);

    return array[index];
}


/*
 * Generate a sentence.
 */

function generateSentence(random) {

    var subject =
        choose(random, vocabulary.subjects);

    var adjective =
        choose(random, vocabulary.adjectives);

    var noun =
        choose(random, vocabulary.nouns);

    var verb =
        choose(random, vocabulary.verbs);

    var adverb =
        choose(random, vocabulary.adverbs);

    var secondNoun =
        choose(random, vocabulary.nouns);


    var sentenceType =
        Math.floor(random() * 5);


    var sentence;


    if (sentenceType === 0) {

        sentence =
            subject +
            " " +
            verb +
            " the " +
            adjective +
            " " +
            noun +
            " " +
            adverb +
            ".";

    } else if (sentenceType === 1) {

        sentence =
            "The " +
            adjective +
            " " +
            noun +
            " " +
            verb +
            " while the " +
            secondNoun +
            " remained nearby.";

    } else if (sentenceType === 2) {

        sentence =
            subject +
            " " +
            verb +
            " the " +
            noun +
            " and discovered something " +
            adjective +
            ".";

    } else if (sentenceType === 3) {

        sentence =
            "Beyond the " +
            adjective +
            " " +
            noun +
            ", the " +
            secondNoun +
            " waited.";

    } else {

        sentence =
            "For a moment, " +
            subject +
            " " +
            verb +
            " and listened to the " +
            adjective +
            " " +
            noun +
            ".";

    }


    return (
        sentence.charAt(0).toUpperCase() +
        sentence.slice(1)
    );
}


/*
 * Generate the contents of a book.
 */

function generateBookText(address) {

    var seed =
        createSeed(address);

    var random =
        createRandom(seed);

    var paragraphCount =
        3 + Math.floor(random() * 4);

    var paragraphs = [];


    for (var i = 0; i < paragraphCount; i++) {

        var sentenceCount =
            4 + Math.floor(random() * 5);

        var sentences = [];


        for (var j = 0; j < sentenceCount; j++) {

            sentences.push(
                generateSentence(random)
            );
        }


        paragraphs.push(
            "<p>" +
            sentences.join(" ") +
            "</p>"
        );
    }


    return paragraphs.join("");
}


/*
 * Create a book element.
 */

function createBook(
    hexagon,
    wall,
    shelf,
    position
) {

    var book =
        document.createElement("div");

    book.className = "book";

    book.textContent =
        "Book " + position;

    book.dataset.hexagon = hexagon;
    book.dataset.wall = wall;
    book.dataset.shelf = shelf;
    book.dataset.position = position;


    book.addEventListener("click", function () {

        openBook(
            hexagon,
            wall,
            shelf,
            position
        );

    });


    return book;
}


/*
 * Create a shelf.
 */

function createShelf(
    hexagon,
    wall,
    shelfNumber
) {

    var shelf =
        document.createElement("div");

    shelf.className = "shelf";

    shelf.dataset.shelf =
        shelfNumber;


    for (var i = 1; i <= 20; i++) {

        var book = createBook(
            hexagon,
            wall,
            shelfNumber,
            i
        );

        shelf.appendChild(book);
    }


    return shelf;
}


/*
 * Create a wall.
 */

function createWall(
    hexagon,
    wallNumber
) {

    var wall =
        document.createElement("div");

    wall.className = "wall";


    var heading =
        document.createElement("h3");

    heading.textContent =
        "Wall " + wallNumber;

    wall.appendChild(heading);


    var shelves =
        document.createElement("div");

    shelves.className =
        "shelves";


    for (var i = 1; i <= 4; i++) {

        var shelf = createShelf(
            hexagon,
            wallNumber,
            i
        );

        shelves.appendChild(shelf);
    }


    wall.appendChild(shelves);

    return wall;
}


/*
 * Generate the current room.
 */

function generateWalls() {

    if (!vocabulary) {
        return;
    }


    room.innerHTML = "";


    for (var i = 1; i <= 4; i++) {

        var wall = createWall(
            currentHexagon,
            i
        );

        room.appendChild(wall);
    }
}


/*
 * Open a book.
 */

function openBook(
    hexagon,
    wall,
    shelf,
    position
) {

    var address =
        hexagon +
        "-" +
        wall +
        "-" +
        shelf +
        "-" +
        position;


    bookTitle.textContent =
        "Book " + position;


    bookAddress.textContent =
        "Hexagon " + hexagon +
        " / Wall " + wall +
        " / Shelf " + shelf +
        " / Book " + position;


    bookText.innerHTML =
        generateBookText(address);


    bookViewer.classList.remove("hidden");
}


/*
 * Close the book viewer.
 */

function closeBookViewer() {

    bookViewer.classList.add("hidden");
}


closeBook.addEventListener(
    "click",
    closeBookViewer
);