const socket = io();

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const usersCountSpan = document.getElementById('users-count');
const usersListDiv = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

let currentUsername = '';
let typingTimer;

loginBtn.addEventListener('click', joinChat);
logoutBtn.addEventListener('click', logout);
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

messageInput.addEventListener('input', handleTyping);

function joinChat() {
    const username = usernameInput.value.trim();
    
    if (username && username.length >= 2) {
        currentUsername = username;
        currentUserSpan.textContent = username;
        
        socket.emit('user-joined', username);
        
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        messageInput.focus();
        
        console.log(`🎉 ${username} joined the chat!`);
    } else {
        alert('Please enter a name (at least 2 letters) 😊');
    }
}

function logout() {
    console.log(`👋 ${currentUsername} is leaving...`);
    
    currentUsername = '';
    usernameInput.value = '';
    messagesContainer.innerHTML = '<div class="welcome-message"><h3>🎉 Welcome to the chat!</h3><p>Start typing below to send your first message</p></div>';
    usersListDiv.innerHTML = '';
    
    chatContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    socket.disconnect();
    socket.connect();
}

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message) {
        console.log(`💬 Sending: ${message}`);
        
        displayMessage({
            username: currentUsername,
            message: message,
            timestamp: new Date().toLocaleTimeString()
        }, true);
        
        socket.emit('chat-message', { message });
        
        messageInput.value = '';
        socket.emit('typing', { isTyping: false });
    }
}

function handleTyping() {
    socket.emit('typing', { isTyping: true });
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('typing', { isTyping: false });
    }, 1000);
}

function displayMessage(data, isOwn = false) {
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${isOwn ? 'You' : data.username}</span>
            <span class="message-time">${data.timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log(`📨 New message from ${data.username}: ${data.message}`);
}

function displaySystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;
    messagesContainer.appendChild(systemDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log(`📢 System: ${message}`);
}

function updateUsersList(users) {
    usersListDiv.innerHTML = '';
    usersCountSpan.textContent = users.length;
    
    users.forEach(username => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <div class="user-status"></div>
            <span>${escapeHtml(username)}</span>
            ${username === currentUsername ? ' (You)' : ''}
        `;
        usersListDiv.appendChild(userDiv);
    });
    
    console.log(`👥 Updated users list: ${users.join(', ')}`);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

socket.on('chat-message', (data) => {
    displayMessage(data);
});

socket.on('user-connected', (username) => {
    displaySystemMessage(`🎉 ${username} joined the chat`);
});

socket.on('user-disconnected', (username) => {
    displaySystemMessage(`👋 ${username} left the chat`);
});

socket.on('users-list', (users) => {
    updateUsersList(users);
});

socket.on('update-users', (users) => {
    updateUsersList(users);
});

socket.on('user-typing', (data) => {
    if (data.isTyping) {
        typingIndicator.textContent = `💭 ${data.username} is typing...`;
    } else {
        typingIndicator.textContent = '';
    }
});

socket.on('connect', () => {
    console.log('🔌 Connected to chat server!');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    displaySystemMessage('⚠️ Connection lost. Trying to reconnect...');
});

socket.on('connect_error', (error) => {
    console.log('💥 Connection error:', error);
    displaySystemMessage('❌ Failed to connect to server');
});

console.log('🚀 Chat app loaded and ready!');
