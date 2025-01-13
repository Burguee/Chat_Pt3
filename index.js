const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require("socket.io")
const port = 3000

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

function findIdPerNickname (nickname) {
    for (const [id, user] of connectedUsers.entries()) {
        if (user.nickname === nickname) {
            return id
        }
    }
    return null
}

const connectedUsers = new Map()

io.on('connection', (socket) => {

    console.log(`Um usuário com o id ${socket.id} conectou ao servidor`)
    
    socket.on('changeNickname', (userData) => {
        socket.data.nickname = userData.nickname
        socket.userColor = userData.color
        
        connectedUsers.set(socket.id, {
            nickname: userData.nickname, 
            color: userData.color
        })
        io.emit('changeNickname', {
            nickname: userData.nickname,
            userColor: userData.color
        })
        io.emit('existingUsers', Array.from(connectedUsers.values()))
        console.log("connecteds", connectedUsers)
    })

    socket.on('getExistingUsers', () => {
        socket.emit('existingUsers', Array.from(connectedUsers.values()))
    })

    socket.on('publicMessage', (publicMessageData) => {
        io.emit('publicMessage', {
            message: publicMessageData.message,
            nickname: socket.data.nickname,
            color: socket.userColor,
            isImage: publicMessageData.isImage
        })
    })

    socket.on('privateMessage', (privateMessageData) => {
        message = privateMessageData.message
        recivedNickname = privateMessageData.recivedNickname
        const socketId = findIdPerNickname(recivedNickname)
        if (socketId) {
            console.log(`o usuario ${socket.data.nickname} enviou a mensagem ${message} para o usuario ${socketId}`)    
            io.to(socketId).emit('privateMessage', {
                message: message,
                nickname: socket.data.nickname,
                color: socket.userColor,
                isImage: privateMessageData.isImage
            })            
        } else {
            console.error(`Recived with nickname "${recivedNickname}" not found`)
        }
    })

    socket.on('disconnect', () => {
        const disconnectedUser = connectedUsers.get(socket.id)
        connectedUsers.delete(socket.id)
        if (disconnectedUser) {
            io.emit('userDisconnected', {
                nickname: disconnectedUser.nickname,
                color: disconnectedUser.color
            })
        }
        console.log("desconnecteds", connectedUsers)
    })

})

server.listen(port, () => {
    console.log(`Servidor rodando...`)
})