const {Server} = require('socket.io')
const {heroes} = require("./heroes")

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function effectChance(randomNumber, chance) {
    return randomNumber <= chance
}

function getEffect(slots = 0) {
    const effectArr = ["", "Damage", "Block", "Steal"]
    let result = []

    for (let i = 1; i <= slots; i++) {
        const chance = effectChance(randomInteger(1, 100), 50)
        if (chance) {
            const index = randomInteger(1, 3)
            result.push(effectArr[index])
        }
    }

    return result
}

function getWeaponImg() {
    const weapons = [
        "http://localhost:8000/weapons/w1.png",
        "http://localhost:8000/weapons/w2.png",
        "http://localhost:8000/weapons/w3.png",
        "http://localhost:8000/weapons/w4.png",
        "http://localhost:8000/weapons/w5.png",
        "http://localhost:8000/weapons/w6.png",
        "http://localhost:8000/weapons/w7.png",
        "http://localhost:8000/weapons/w8.png",
        "http://localhost:8000/weapons/w9.png",
        "http://localhost:8000/weapons/w10.png",
    ]

    const index = randomInteger(0, 9)

    return weapons[index]
}

function getArmourImg() {
    const armours = [
        "http://localhost:8000/armours/a1.png",
        "http://localhost:8000/armours/a2.png",
        "http://localhost:8000/armours/a3.png",
        "http://localhost:8000/armours/a4.png",
        "http://localhost:8000/armours/a5.png",
        "http://localhost:8000/armours/a6.png",
        "http://localhost:8000/armours/a7.png",
        "http://localhost:8000/armours/a8.png",
        "http://localhost:8000/armours/a9.png",
        "http://localhost:8000/armours/a10.png",
    ]

    const index = randomInteger(0, 9)

    return armours[index]
}


let users = []
let rooms = []
let battles = []
let timers = []


module.exports = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000"
        }
    });

    io.on('connection', (socket) => {
        console.log("--- a user connected", socket.id)


        socket.on("setUsername", username => {
            const foundUser = users.find(x => x.username === username)
            const index = heroes.findIndex(x => x.username === username)

            if (!foundUser && index > -1) {
                const user = {
                    id: socket.id,
                    username
                }
                heroes[index].online = true
                users.push(user)
            }

            io.to(username).emit('currentUser', heroes[index])
        })


        socket.on('getHeroes', msg => {
            io.emit('heroes', heroes)
        })


        socket.on('getCurrentUser', user => {
            const index = heroes.findIndex(x => x.username === user.username)

            io.emit('currentUser', heroes[index])
        })


        socket.on('setBattleWeapon', ({user, weapon}) => {
            const index = heroes.findIndex(x => x.username === user.username)
            heroes[index].battleWeapon = weapon
        })


        socket.on('setBattleArmour', ({user, armour}) => {
            const index = heroes.findIndex(x => x.username === user.username)
            heroes[index].battleArmour = armour
        })


        socket.on('setBattlePotion', ({user, potion}) => {
            const index = heroes.findIndex(x => x.username === user.username)
            heroes[index].battlePotion = potion
        })


        socket.on('sendRequest', username2 => {
            const foundUser2 = users.find(x => x.username === username2)
            const currentUser = users.find(x => x.id === socket.id)
            if (!foundUser2 || !currentUser) return

            const roomId = "room" + Date.now()
            socket.join(roomId);

            const data = {
                username1: currentUser.username,
                username2: username2,
                roomId
            }

            const foundRoomId = rooms.find(x => x.roomId === roomId)
            if (!foundRoomId) {
                rooms.push(data)
            }

            io.to(roomId).emit('battleRoom', {msg: "battleRoom " + currentUser.username, roomId})
            io.to(foundUser2.id).emit('request', data)
        })


        socket.on('acceptRequest', ({roomId, username1, username2}) => {
            const currentUser = users.find(x => x.id === socket.id)
            if (!currentUser) return

            socket.join(roomId);
            io.to(roomId).emit('battleRoom', {msg: "battleRoom " + currentUser.username, roomId})

            const user1Index = heroes.findIndex(x => x.username === username1)
            const user2Index = heroes.findIndex(x => x.username === username2)

            const foundRoomId = battles.find(x => x.roomId === roomId)
            if (!foundRoomId) {
                const battle = {
                    roomId,
                    user1: heroes[user1Index],
                    user2: heroes[user2Index]
                }
                battles.push(battle)
            }

            io.to(roomId).emit('battleUser1', heroes[user1Index])
            io.to(roomId).emit('battleUser2', heroes[user2Index])
            io.to(roomId).emit('battleRoom', {msg: "welcome", roomId, username1})
        })

        function setArenaTime(roomId, username, sec) {
            const foundTimers = timers.filter(x => x.roomId === roomId)
            for (let i = 0; i < foundTimers.length; i++) {
                clearInterval(foundTimers[i].interval)
            }


            const foundBattleId = battles.find(x => x.roomId === roomId)
            if (!foundBattleId) return

            let user1Attack = true
            let data = {
                roomId,
                username,
                sec
            }

            if (foundBattleId.user1.username === username) {
                data.username = foundBattleId.user1.username
                user1Attack = true
            } else {
                data.username = foundBattleId.user2.username
                user1Attack = false
            }


            // interval body
            const interval = setInterval(() => {

                data.sec = sec

                if (user1Attack) {
                    data.username = foundBattleId.user1.username
                } else {
                    data.username = foundBattleId.user2.username
                }

                io.to(roomId).emit('arenaTime', data)

                sec -= 1
                if (sec <= 0) {
                    sec = 20
                    user1Attack = !user1Attack
                }

            }, 1000)


            timers.push({
                id: Date.now(),
                roomId,
                interval
            })
        }


        socket.on('getArenaTime', ({roomId, username, sec}) => {
            setArenaTime(roomId,username,20)
        })


        socket.on('getPotion', ({roomId, username}) => {
            let user1 = {}
            let user2 = {}

            let battle = battles.find(x => x.roomId === roomId)
            if (!battle) return

            if (battle.user1.username === username) {
                if(battle.user1.battlePotion.potion>0){
                    battle.user1.hp += battle.user1.battlePotion.potion
                    if(battle.user1.hp>100) battle.user1.hp = 100
                    battle.user1.battlePotion.potion = 0

                    return io.to(roomId).emit('battleUser1', battle.user1)
                }
            }

            if (battle.user2.username === username) {
                if(battle.user2.battlePotion.potion>0){
                    battle.user2.hp += battle.user2.battlePotion.potion
                    if(battle.user2.hp>100) battle.user2.hp = 100
                    battle.user2.battlePotion.potion = 0

                    return io.to(roomId).emit('battleUser2', battle.user2)
                }
            }
        })


        socket.on('runAttack', ({roomId, attackUsername}) => {
                let user1 = {}
                let user2 = {}

                let battle = battles.find(x => x.roomId === roomId)
                if (!battle) return

                if (battle.user1.username === attackUsername) {
                    // +
                    battle.user1.gold += randomInteger(0, battle.user1.battleWeapon.weaponGold)

                    // -
                    battle.user2.hp -= Math.round(battle.user1.battleWeapon.weaponDamage*battle.user2.battleArmour.armourPower/100)
                    console.log("hp1", battle.user2.hp)
                    io.to(roomId).emit('battleUser1', battle.user1)
                    io.to(roomId).emit('battleUser2', battle.user2)
                    return setArenaTime(roomId,battle.user2.username,20)
                }

                if (battle.user2.username === attackUsername) {
                    // +
                    battle.user2.gold += randomInteger(0, battle.user2.battleWeapon.weaponGold)

                    // -
                    battle.user1.hp -= Math.round(battle.user2.battleWeapon.weaponDamage*battle.user1.battleArmour.armourPower/100)
                    console.log("hp1", battle.user2.hp)

                    io.to(roomId).emit('battleUser1', battle.user1)
                    io.to(roomId).emit('battleUser2', battle.user2)
                    return setArenaTime(roomId,battle.user1.username,20)
                }
            }
        )


        socket.on('getItems', user => {
            const foundUser = users.find(x => x.username === user.username)
            const index = heroes.findIndex(x => x.username === user.username)
            if (!foundUser || index < 0) return

            if (heroes[index].money < 100) return io.to(foundUser.id).emit('currentUser', heroes[index])
            heroes[index].money -= 100
            io.to(foundUser.id).emit('currentUser', heroes[index])

            let weaponDamage = 0
            let weaponSlots = 0
            let weaponEffects = []
            let weaponGold = 0

            let armourPower = 0
            let armourSlots = 0
            let armourEffects = []

            let potion = 0


            const weaponQuality = randomInteger(1, 3) // 1-A, 2-B, 3-C

            if (weaponQuality === 1) {
                weaponDamage = randomInteger(6, 30)
                weaponSlots = randomInteger(0, 3)
                weaponGold = randomInteger(0, 10)
                weaponSlots > 0 ? weaponEffects = getEffect(weaponSlots) : weaponEffects = []
            }

            if (weaponQuality === 2) {
                weaponDamage = randomInteger(3, 20)
                weaponSlots = randomInteger(0, 1)
                weaponGold = randomInteger(0, 6)
                weaponSlots > 0 ? weaponEffects = getEffect(weaponSlots) : weaponEffects = []
            }

            if (weaponQuality === 3) {
                weaponDamage = randomInteger(1, 5)
                weaponSlots = 0
                weaponGold = randomInteger(0, 3)
                weaponEffects = []
            }


            const armourQuality = randomInteger(1, 3) // 1-A, 2-B, 3-C

            if (armourQuality === 1) {
                armourPower = randomInteger(10, 90)
                armourSlots = randomInteger(0, 3)

                armourSlots > 0 ? armourEffects = getEffect(armourSlots) : armourEffects = []
            }

            if (armourQuality === 2) {
                armourPower = randomInteger(0, 50)
                armourSlots = randomInteger(0, 1)

                armourSlots > 0 ? armourEffects = getEffect(armourSlots) : armourEffects = []
            }

            if (armourQuality === 3) {
                armourPower = randomInteger(0, 20)
                armourSlots = 0

                armourEffects = []
            }


            potion = randomInteger(1, 100)


            const items = {
                weapon: {
                    type: "weapon",
                    image: getWeaponImg(),
                    weaponQuality,
                    weaponDamage,
                    weaponSlots,
                    weaponGold,
                    weaponEffects,
                },
                armour: {
                    type: "armour",
                    image: getArmourImg(),
                    armourQuality,
                    armourPower,
                    armourSlots,
                    armourEffects
                },
                potion: {
                    type: "potion",
                    image: "http://localhost:8000/potion/p1.png",
                    potion
                }
            }

            io.to(foundUser.id).emit('items', items)
        })
    })
}
