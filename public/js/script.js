const socket = io();
const nicknameInput = document.getElementById("nickname")
const messageInput = document.getElementById("message-input")
const sendButton = document.getElementById("send-button")
const messagesDisplay = document.getElementById("messages-display")
const userNames = document.getElementById("user-names")
const leaveButton = document.getElementById("leave")
const allUserList = document.getElementById("allUserList")
const nicknameColorInput = document.getElementById("nicknameColorInput")
const audioMessageCheckbox = document.getElementById("audioMessageCheckbox")
const audioMessage = document.getElementById("audioMessage")
const image = document.getElementById("image")

document.getElementById("message-input-area").style.visibility = "hidden"
let userList = []
let selectedUser = null
let nickname = ''
let selectedColor = ''
let userColors = {}
let countClick = 0
let blockedUsers = []

function hiddenNickname () {
    nickname = document.getElementById("nickname").value

    if (nickname.trim() !== "") {
        socket.emit("changeNickname", {
            nickname: nickname,
            color: selectedColor
        })
        document.getElementById("nickname-form-hidden").style.display = "none"
        document.getElementById("message-input-area").style.visibility = "visible"
    } else {
        const error = document.getElementById("error-nickname").textContent = "Por favor, digite um apelido."
    }
}

function addUserToList(user) {
    const userNamesElement = document.createElement('li')
    const blockIcon = document.createElement('i')
    blockIcon.classList.add('fa-solid', 'fa-ban', 'block-icon')
    blockIcon.setAttribute('data-blocked', 'false')
    userNamesElement.innerHTML = user.nickname
    userNamesElement.style.color = user.color
    userNamesElement.appendChild(blockIcon)
    userNames.appendChild(userNamesElement)
    userNames.scrollTop = userNames.scrollHeight
}

function displayMessage(content, isImage = false) {
    const messageElement = document.createElement('div')
    messageElement.classList.add('message')
    
    
    messageElement.innerHTML = content
    
    
    messagesDisplay.appendChild(messageElement)
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight
}

function removeUserFromList(nickname) {
    const userListItems = document.querySelectorAll('#user-names li');
    userListItems.forEach(item => {
        if (item.textContent === nickname) {
            item.remove()
        }
    })
}

function sendMessage(content, isImage = false, targetUser = null) {
    if (isImage && content instanceof File) {
        const reader = new FileReader()
        reader.onload = (e) => {
            const base64Image = e.target.result
            if (targetUser) {
                socket.emit('privateMessage', {
                    message: base64Image,
                    recivedNickname: targetUser,
                    isImage: true
                })
                displayMessage(`<span class="username">Enviou imagem para <span style="color: ${userColors[targetUser]}">${targetUser}</span>: </span><img src="${base64Image}" alt="Pré-visualização da Imagem" class="images">`)
            } else {
                socket.emit('publicMessage', {
                    message: base64Image,
                    isImage: true
                })
            }
        }
        reader.readAsDataURL(content)
    } else if (!isImage) {
        if (content.trim() !== "") {
            if (targetUser) {
                socket.emit('privateMessage', {
                    message: content,
                    recivedNickname: targetUser,
                    isImage: false
                })
                displayMessage(`<span class="username">Falou para <span style="color: ${userColors[targetUser]}">${targetUser}</span>: </span>${content}`)
            } else {
                socket.emit('publicMessage', {
                    message: content,
                    isImage: false
                })
            }
            messageInput.value = ""
        }
    }
}

function leaveChat() {
    socket.disconnect()
    window.location.reload()
}

function updateUIWithUserList(userList) {
    userNames.innerHTML = ""
    userColors = {}
    const sortedList = [...userList].sort((a, b) => a.nickname.localeCompare(b.nickname))
    sortedList.forEach((user) => {
        userColors[user.nickname] = user.color
        addUserToList(user)
    })
}

function blockUsers (blockedNickname) {
    blockedUsers.push(blockedNickname)
    const blockedUserColor = userColors[blockedNickname]
    displayMessage(`<span class="username">Você bloqueou o usuário <span style="color: ${blockedUserColor}">${blockedNickname}</span></span>`)
}

function unblockUsers (unblockedNickname) {
    blockedUsers.splice(unblockedNickname)
    const unblockedUserColor = userColors[unblockedNickname]
    displayMessage(`<span class="username">Você desbloqueou o usuário <span style="color: ${unblockedUserColor}">${unblockedNickname}</span></span>`)
}

function reproduceAudioMessage () {
    if (audioMessageCheckbox.checked) {
        audioMessage.currentTime = 0
        audioMessage.play()
    }
}

nicknameColorInput.addEventListener('change', () => {
    selectedColor = nicknameColorInput.value
})

socket.on('connect', () => {
    socket.emit('getExistingUsers')
})

socket.on('existingUsers', (userList) => {
    updateUIWithUserList(userList)
})

userNames.addEventListener('click', function(event) {
    if (event.target.tagName === 'LI') {
        const clickedUser = event.target.textContent
        if (clickedUser !== nickname) {
            selectedUser = event.target.textContent
            messageInput.placeholder = `Digite sua mensagem para o usuário ${selectedUser}...`
        }
    }
})

allUserList.addEventListener('click', function(event) {
    selectedUser = null
    messageInput.placeholder = `Digite sua mensagem...`
})

sendButton.addEventListener("click", () => {
    const message = messageInput.value
    sendMessage(message, false, selectedUser)
})

messageInput.addEventListener("keypress", (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        const message = messageInput.value
        sendMessage(message, false, selectedUser)
    } else if (event.key === 'Enter' && event.shiftKey) {

    }
})

socket.on('publicMessage', (messageData) => {
    if (!blockedUsers.includes(messageData.nickname)) {
        if (messageData.isImage) {
            displayMessage(`<span class="username" style="color: ${messageData.color}">${messageData.nickname}</span> falou: <img src="${messageData.message}" alt="Pré-visualização da Imagem" class="images">`)
        } else {
            displayMessage(`<span class="username" style="color: ${messageData.color}">${messageData.nickname}</span> falou: ${messageData.message}`)
        }
    }
    if (messageData.nickname !== nicknameInput.value) {
        reproduceAudioMessage()
    }
})

socket.on('privateMessage', (data) => {
    if (!blockedUsers.includes(data.nickname)) {
        if (data.isImage) {
            displayMessage(`<span class="username">Mensagem privada de <span style="color: ${data.color}">${data.nickname}</span>: </span><img src="${data.message}" alt="Pré-visualização da Imagem" class="images">`)
        } else {
            displayMessage(`<span class="username">Mensagem privada de <span style="color: ${data.color}">${data.nickname}</span>: </span>${data.message}`)
        }
    }
    reproduceAudioMessage()
})

socket.on('changeNickname', (userData) => {
    displayMessage(`<span class="username" style="color: ${userData.userColor}">${userData.nickname} </span>entrou na sala...`)
    addUserToList(userData.nickname, userData.userColor)
})

socket.on('userDisconnected', (disconnectUserData) => {
    console.log(disconnectUserData)
    removeUserFromList(disconnectUserData.nickname)
    displayMessage(`<span class="username" style="color: ${disconnectUserData.color}">${disconnectUserData.nickname} </span>saiu da sala...`)
})

userNames.addEventListener('click', function(event) {
    if (event.target.tagName === 'I') {
        const blockIcon = event.target
        const blockedNickname = blockIcon.parentElement.textContent
        const isBlocked = blockIcon.dataset.blocked === 'true'

        if (blockedNickname !== nickname) {
            if (!isBlocked) {
                blockUsers(blockedNickname)
                blockIcon.setAttribute('data-blocked', 'true')
            } else {
                unblockUsers(blockedNickname)
                blockIcon.setAttribute('data-blocked', 'false')
            }
        }
    }
})

image.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (file) {
        sendMessage(file, true, selectedUser)
    }
})