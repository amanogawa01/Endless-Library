"use strict";

var room = document.getElementById("room");

var bookViewer = document.getElementById("book-viewer");
var closeBook = document.getElementById("close-book");

var bookTitle = document.getElementById("book-title");
var bookAddress = document.getElementById("book-address");
var bookText = document.getElementById("book-text");

var currentHexagon = "000000";

var vocabulary = null;
var templates = null;


/*
 * Load the library data.
 */

Promise.all([
    fetch("data/vocabulary.json"),
    fetch("data/templates.json")
])
    .then(function (responses) {

        for (var i = 0; i < responses.length; i++) {

            if (!responses[i].ok) {
                throw new Error(
                    "Could not load library data."
                );
            }
        }

        return Promise.all([
            responses[0].json(),
            responses[1].json()
        ]);
    })
    .then(function (data) {

        vocabulary = data[0];
        templates = data[1];

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

    if (array.length === 0) {
        throw new Error(
            "Cannot choose from an empty array."
        );
    }

    var index =
        Math.floor(random() * array.length);

    return array[index];
}


/*
 * Select an item that is different from
 * a previous value when possible.
 */

function chooseDifferent(
    random,
    array,
    previous
) {

    if (array.length <= 1) {
        return array[0];
    }

    var choice =
        choose(random, array);

    var attempts = 0;

    while (
        choice === previous &&
        attempts < 10
    ) {

        choice =
            choose(random, array);

        attempts++;
    }

    return choice;
}


/*
 * Select a noun with a specific property.
 */

function chooseNoun(
    random,
    property
) {

    var matchingNouns =
        vocabulary.nouns.filter(
            function (noun) {

                return noun[property] === true;
            }
        );


    if (matchingNouns.length === 0) {

        throw new Error(
            "No nouns found for property: " +
            property
        );
    }


    return choose(
        random,
        matchingNouns
    ).word;
}


/*
 * Select a verb with a specific target.
 */

function chooseVerbByTarget(
    random,
    verbs,
    target
) {

    var matchingVerbs =
        verbs.filter(
            function (verb) {

                return verb.target === target;
            }
        );


    if (matchingVerbs.length === 0) {

        throw new Error(
            "No verbs found for target: " +
            target
        );
    }


    return choose(
        random,
        matchingVerbs
    );
}


/*
 * Select a noun compatible with a verb.
 */

function chooseVerbTarget(
    random,
    verb
) {

    return chooseNoun(
        random,
        verb.target
    );
}


/*
 * Replace every occurrence of a placeholder.
 */

function replacePlaceholder(
    sentence,
    placeholder,
    value
) {

    return sentence
        .split(placeholder)
        .join(value);
}


/*
 * Fill a structured sentence template.
 */

function fillTemplate(
    template,
    random,
    previousSubject
) {

    var sentence =
        template.template;


    var subject =
        chooseDifferent(
            random,
            vocabulary.subjects,
            previousSubject
        );


    var secondSubject =
        chooseDifferent(
            random,
            vocabulary.subjects,
            subject
        );


    var replacements = {

        "{subject}":
            subject,

        "{secondSubject}":
            secondSubject,

        "{place}":
            chooseNoun(
                random,
                "place"
            ),

        "{walkablePlace}":
            chooseNoun(
                random,
                "walkable"
            ),

        "{adjective}":
            choose(
                random,
                vocabulary.adjectives
            ),

        "{adverb}":
            choose(
                random,
                vocabulary.adverbs
            )
    };


    /*
     * Perception.
     */

    if (
        template.type === "perception" ||
        template.type === "perception_adverb"
    ) {

        var perceptionVerb =
            choose(
                random,
                vocabulary.perceptionVerbs
            );


        replacements["{perceptionVerb}"] =
            perceptionVerb.word;


        replacements["{perceptionTarget}"] =
            chooseVerbTarget(
                random,
                perceptionVerb
            );
    }


    /*
     * Movement with a destination.
     */

    if (
        template.type === "movement_enter" ||
        template.type === "movement_cross" ||
        template.type === "movement_return" ||
        template.type === "movement_walk"
    ) {

        var movementTarget;


        if (template.type === "movement_enter") {

            var enterVerb =
                chooseVerbByTarget(
                    random,
                    vocabulary.movementVerbs,
                    "enterable"
                );


            replacements["{movementVerb}"] =
                enterVerb.word;


            movementTarget =
                chooseVerbTarget(
                    random,
                    enterVerb
                );
        }


        if (template.type === "movement_cross") {

            var crossVerb =
                chooseVerbByTarget(
                    random,
                    vocabulary.movementVerbs,
                    "crossable"
                );


            replacements["{movementVerb}"] =
                crossVerb.word;


            movementTarget =
                chooseVerbTarget(
                    random,
                    crossVerb
                );
        }


        if (template.type === "movement_return") {

            var returnVerb =
                chooseVerbByTarget(
                    random,
                    vocabulary.movementVerbs,
                    "place"
                );


            replacements["{movementVerb}"] =
                returnVerb.word;


            movementTarget =
                chooseVerbTarget(
                    random,
                    returnVerb
                );
        }


        if (template.type === "movement_walk") {

            var walkVerb =
                chooseVerbByTarget(
                    random,
                    vocabulary.movementVerbs,
                    "walkable"
                );


            replacements["{movementVerb}"] =
                walkVerb.word;


            movementTarget =
                chooseVerbTarget(
                    random,
                    walkVerb
                );
        }


        replacements["{movementTarget}"] =
            movementTarget;
    }


    /*
     * Movement without a destination.
     *
     * Only use "returned" and "walked" here,
     * since "entered" and "left" normally
     * require a destination.
     */

    if (template.type === "subject_movement") {

        var simpleMovementVerbs =
            vocabulary.movementVerbs.filter(
                function (verb) {

                    return (
                        verb.word === "returned" ||
                        verb.word === "walked"
                    );
                }
            );


        replacements["{movementVerb}"] =
            choose(
                random,
                simpleMovementVerbs
            ).word;
    }


    /*
     * Discovery.
     */

    if (template.type === "discovery") {

        var discoveryVerb =
            choose(
                random,
                vocabulary.discoveryVerbs
            );


        replacements["{discoveryVerb}"] =
            discoveryVerb.word;


        replacements["{discoveryTarget}"] =
            chooseVerbTarget(
                random,
                discoveryVerb
            );
    }


    if (template.type === "subject_discovery") {

        replacements["{discoveryVerb}"] =
            choose(
                random,
                vocabulary.discoveryVerbs
            ).word;
    }


    /*
     * Memory.
     */

    if (template.type === "memory") {

        var memoryVerb =
            choose(
                random,
                vocabulary.memoryVerbs
            );


        replacements["{memoryVerb}"] =
            memoryVerb.word;


        replacements["{memoryTarget}"] =
            chooseVerbTarget(
                random,
                memoryVerb
            );
    }


    if (template.type === "subject_memory") {

        replacements["{memoryVerb}"] =
            choose(
                random,
                vocabulary.memoryVerbs
            ).word;
    }


    /*
     * Thought.
     */

    if (template.type === "thought") {

        var thoughtVerb =
            choose(
                random,
                vocabulary.thoughtVerbs
            );


        replacements["{thoughtVerb}"] =
            thoughtVerb.word;


        replacements["{thoughtTarget}"] =
            chooseVerbTarget(
                random,
                thoughtVerb
            );
    }


    /*
     * Actions.
     */

    if (
        template.type === "action" ||
        template.type === "action_adverb"
    ) {

        var actionVerb =
            choose(
                random,
                vocabulary.actionVerbs
            );


        replacements["{actionVerb}"] =
            actionVerb.word;


        replacements["{actionTarget}"] =
            chooseVerbTarget(
                random,
                actionVerb
            );
    }


    /*
     * State.
     */

    if (template.type === "state") {

        var stateVerb =
            choose(
                random,
                vocabulary.stateVerbs
            );


        replacements["{stateVerb}"] =
            stateVerb.word;


        replacements["{stateTarget}"] =
            chooseVerbTarget(
                random,
                stateVerb
            );
    }


    /*
     * Replace all placeholders.
     */

    for (var placeholder in replacements) {

        sentence =
            replacePlaceholder(
                sentence,
                placeholder,
                replacements[placeholder]
            );
    }


    return {
        text:
            sentence.charAt(0).toUpperCase() +
            sentence.slice(1),

        subject:
            subject,

        type:
            template.type
    };
}


/*
 * Generate a sentence.
 */

function generateSentence(
    random,
    previousSubject,
    previousType
) {

    var availableTemplates =
        templates.sentences;


    /*
     * Avoid using the same template
     * type twice in a row.
     */

    if (availableTemplates.length > 1) {

        var filteredTemplates =
            availableTemplates.filter(
                function (template) {

                    return (
                        template.type !==
                        previousType
                    );
                }
            );


        if (filteredTemplates.length > 0) {

            availableTemplates =
                filteredTemplates;
        }
    }


    var template =
        choose(
            random,
            availableTemplates
        );


    return fillTemplate(
        template,
        random,
        previousSubject
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

    var previousSubject = null;

    var previousType = null;


    for (var i = 0; i < paragraphCount; i++) {

        var sentenceCount =
            4 + Math.floor(random() * 5);

        var sentences = [];


        for (var j = 0; j < sentenceCount; j++) {

            var generated =
                generateSentence(
                    random,
                    previousSubject,
                    previousType
                );


            sentences.push(
                generated.text
            );


            previousSubject =
                generated.subject;


            previousType =
                generated.type;
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

        var book =
            createBook(
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

        var shelf =
            createShelf(
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

    if (!vocabulary || !templates) {
        return;
    }


    room.innerHTML = "";


    for (var i = 1; i <= 4; i++) {

        var wall =
            createWall(
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


    try {

        bookText.innerHTML =
            generateBookText(address);

    } catch (error) {

        console.error(
            "Could not generate book " +
            address,
            error
        );


        bookText.innerHTML =
            "<p>This book could not be generated.</p>";
    }


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