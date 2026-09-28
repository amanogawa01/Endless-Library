"use strict";

var room = document.getElementById("room");


function createBook(number) {

    var book = document.createElement("div");

    book.className = "book";

    book.textContent = "Book " + number;

    return book;
}


function generateBooks() {

    var shelf = document.querySelector(".shelf");

    shelf.innerHTML = "";

    for (var i = 1; i <= 20; i++) {

        var book = createBook(i);

        shelf.appendChild(book);
    }
}


generateBooks();