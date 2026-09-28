"use strict";

var room = document.getElementById("room");

var bookViewer = document.getElementById("book-viewer");
var closeBook = document.getElementById("close-book");

var bookTitle = document.getElementById("book-title");
var bookAddress = document.getElementById("book-address");
var bookText = document.getElementById("book-text");


var currentHexagon = "000000";


function createBook(hexagon, wall, shelf, position) {

    var book = document.createElement("div");

    book.className = "book";

    book.textContent = "Book " + position;

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


function createShelf(hexagon, wall, shelfNumber) {

    var shelf = document.createElement("div");

    shelf.className = "shelf";

    shelf.dataset.shelf = shelfNumber;


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


function createWall(hexagon, wallNumber) {

    var wall = document.createElement("div");

    wall.className = "wall";


    var heading = document.createElement("h3");

    heading.textContent = "Wall " + wallNumber;

    wall.appendChild(heading);


    var shelves = document.createElement("div");

    shelves.className = "shelves";


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


function generateWalls() {

    room.innerHTML = "";


    for (var i = 1; i <= 4; i++) {

        var wall = createWall(
            currentHexagon,
            i
        );

        room.appendChild(wall);
    }
}


function openBook(hexagon, wall, shelf, position) {

    bookTitle.textContent =
        "Book " + position;


    bookAddress.textContent =
        "Hexagon " + hexagon +
        " / Wall " + wall +
        " / Shelf " + shelf +
        " / Book " + position;


    bookText.innerHTML =
        "<p>This is the text contained within this book.</p>";


    bookViewer.classList.remove("hidden");
}


function closeBookViewer() {

    bookViewer.classList.add("hidden");
}


closeBook.addEventListener(
    "click",
    closeBookViewer
);


generateWalls();