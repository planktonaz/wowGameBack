function getId() {
    return Math.floor(Date.now() * Math.random())
}

const items = [
    {
        id: getId(),
        name: "Arian",
        image: "http://localhost:8000/images/arin.png",
        hunger: 100,
        eggs: [],
        money: 0,
    },
    {
        id: getId(),
        name: "Barry",
        image: "http://localhost:8000/images/barry.png",
        hunger: 100,
        eggs: [],
        money: 0,
    },
    {
        id: getId(),
        name: "Dan",
        image: "http://localhost:8000/images/dan.png",
        hunger: 100,
        eggs: [],
        money: 0,
    },
    {
        id: getId(),
        name: "Ross",
        image: "http://localhost:8000/images/ross.png",
        hunger: 100,
        eggs: [],
        money: 0,
    },
]

let currentItem =     {
    id: null,
    name: "",
    image: "",
    hunger: 0,
    eggs: [],
    money: 0,
}

module.exports = {
    items: items,
    currentItem: currentItem,
}
