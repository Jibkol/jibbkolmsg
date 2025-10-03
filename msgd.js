// msg.js - Complete WhatsApp/Telegram functionality
document.addEventListener('DOMContentLoaded', function() {
    class JibbApp {
        constructor() {
            this.currentUser = 'You';
            this.chats = new Map();
            this.currentChat = null;
            this.isOnline = true;
            this.mediaRecorder = null;
            this.audioChunks = [];
            this.isRecording = false;
            this.emojiPickerVisible = false;
            this.theme = 'dark';
            this.typingTimers = new Map();
            this.init();
        }

        init() {
            this.loadTheme();
            this.setupEventListeners();
            this.loadChatData();
            this.setupMessageInput();
            this.setupSearch();
            this.setupNavigation();
            this.setupFloatingButtons();
            this.setupVoiceMessages();
            this.setupFileSharing();
            this.setupEmojiPicker();
            this.setupOnlineStatus();
            console.log('JibbApp initialized successfully!');
        }

        // THEME MANAGEMENT
        loadTheme() {
            this.theme = localStorage.getItem('jibbapp-theme') || 'dark';
            this.applyTheme(this.theme);
        }

        applyTheme(theme) {
            const body = document.body;
            const lightIcon = document.getElementById('light-icon');
            const darkIcon = document.getElementById('dark-icon');

            if (theme === 'light') {
                body.classList.add('light-mode');
                if (lightIcon) lightIcon.style.display = 'none';
                if (darkIcon) darkIcon.style.display = 'inline';
                this.updateCSSVariables('light');
            } else {
                body.classList.remove('light-mode');
                if (lightIcon) lightIcon.style.display = 'inline';
                if (darkIcon) darkIcon.style.display = 'none';
                this.updateCSSVariables('dark');
            }
            this.theme = theme;
            localStorage.setItem('jibbapp-theme', theme);
        }

        updateCSSVariables(theme) {
            const root = document.documentElement;
            if (theme === 'light') {
                root.style.setProperty('--wa-bg-main-dark', '#FFFFFF');
                root.style.setProperty('--wa-bg-secondary-dark', '#F0F2F5');
                root.style.setProperty('--wa-bg-input-dark', '#FFFFFF');
                root.style.setProperty('--wa-text-primary-dark', '#111B21');
                root.style.setProperty('--wa-text-secondary-dark', '#667781');
                root.style.setProperty('--wa-text-placeholder-dark', '#8696A0');
                root.style.setProperty('--wa-bubble-incoming-dark', '#FFFFFF');
                root.style.setProperty('--wa-bubble-outgoing-dark', '#D9FDD3');
                root.style.setProperty('--wa-divider-dark', '#E9EDEF');
            } else {
                root.style.setProperty('--wa-bg-main-dark', '#121B22');
                root.style.setProperty('--wa-bg-secondary-dark', '#1E2A32');
                root.style.setProperty('--wa-bg-input-dark', '#202C33');
                root.style.setProperty('--wa-text-primary-dark', '#E9EDEF');
                root.style.setProperty('--wa-text-secondary-dark', '#8696A0');
                root.style.setProperty('--wa-text-placeholder-dark', '#667781');
                root.style.setProperty('--wa-bubble-incoming-dark', '#202C33');
                root.style.setProperty('--wa-bubble-outgoing-dark', '#005C4B');
                root.style.setProperty('--wa-divider-dark', '#2A3942');
            }
        }

        // CHAT MANAGEMENT
        loadChatData() {
            // Enhanced chat data with more realistic content
            const chatData = {
                'chat1': {
                    name: 'Jibbkol',
                    avatar: './assets/BARCELONA MESSI.jpeg',
                    status: 'online',
                    messages: [
                        { type: 'received', text: 'Hello! Welcome to JibbApp! 🚀', time: '2:30 PM', status: 'read' },
                        { type: 'sent', text: 'Thanks! This looks amazing!', time: '2:31 PM', status: 'read' },
                        { type: 'received', text: 'You can try all the features - voice messages, file sharing, emojis, and more!', time: '2:32 PM', status: 'read' }
                    ],
                    unread: 2,
                    lastSeen: 'online',
                    isTyping: false
                },
                'chat2': {
                    name: 'Sarah Wilson',
                    avatar: './assets/profile2.jpg',
                    status: 'offline',
                    messages: [
                        { type: 'received', text: 'Hi! Are we still meeting today?', time: '3:15 PM', status: 'read' },
                        { type: 'sent', text: 'Yes, 4 PM at the usual place?', time: '3:16 PM', status: 'read' },
                        { type: 'received', text: 'Perfect! See you there 👋', time: '3:17 PM', status: 'read' }
                    ],
                    unread: 1,
                    lastSeen: '5 hours ago',
                    isTyping: false
                },
                'chat3': {
                    name: 'Mike Chen',
                    avatar: './assets/profile3.jpg',
                    status: 'online',
                    messages: [
                        { type: 'received', text: 'Hey! Did you check the project files?', time: '2:30 PM', status: 'read' },
                        { type: 'sent', text: 'Not yet, I\'ll review them today', time: '2:31 PM', status: 'read' },
                        { type: 'received', text: 'Great! Let me know if you need any clarification', time: '2:32 PM', status: 'read' },
                        { type: 'sent', text: 'Will do, thanks!', time: '2:33 PM', status: 'read' },
                        { type: 'received', text: 'Also, don\'t forget about the team meeting tomorrow', time: '2:34 PM', status: 'read' }
                    ],
                    unread: 7,
                    lastSeen: 'online',
                    isTyping: false
                }
            };

            this.chats = new Map(Object.entries(chatData));
            this.renderChatList();
        }

        renderChatList() {
            const chatInner = document.getElementById('chat-inner');
            if (!chatInner) return;

            // Clear existing chats (except message windows)
            document.querySelectorAll('.chat:not(.jibapp-message .chat)').forEach(chat => chat.remove());

            this.chats.forEach((chat, chatId) => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                const chatElement = document.createElement('div');
                chatElement.className = 'chat';
                chatElement.dataset.chat = chatId;
                chatElement.innerHTML = `
                    <img src="${chat.avatar}" alt="profile" onerror="this.src='./assets/BARCELONA MESSI.jpeg'">
                    <div class="chat-info">
                        <h4>${chat.name}</h4>
                        <p>${lastMessage ? this.truncateText(lastMessage.text, 35) : 'No messages yet'}</p>
                    </div>
                    <div class="chat-time">
                        <span>${lastMessage ? lastMessage.time : ''}</span>
                        ${chat.unread > 0 ? `<span class="unread-count">${chat.unread}</span>` : ''}
                    </div>
                `;
                chatInner.appendChild(chatElement);
            });
        }

        truncateText(text, maxLength) {
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }

        showChat(chatId) {
            // Hide all chat windows
            document.querySelectorAll('.jibapp-message').forEach(chat => {
                chat.classList.remove('active');
            });
            
            // Show selected chat
            const selectedChat = document.getElementById(chatId);
            if (selectedChat) {
                selectedChat.classList.add('active');
                this.currentChat = chatId;
                this.renderChatMessages(chatId);
                this.markAsRead(chatId);
            }
            
            // Update active state in chat list
            document.querySelectorAll('.chat').forEach(chat => {
                chat.classList.remove('active');
                if (chat.dataset.chat === chatId) {
                    chat.classList.add('active');
                }
            });

            // Close mobile menu if open
            this.closeMobileMenu();

            // Update chat header info
            this.updateChatHeader(chatId);
        }

        renderChatMessages(chatId) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const msgContent = document.querySelector(`#${chatId} .msg-content`);
            if (!msgContent) return;

            msgContent.innerHTML = '';

            // Add encryption message
            const encryptionMsg = document.createElement('div');
            encryptionMsg.className = 'encryption-message';
            encryptionMsg.innerHTML = `
                <img src="./assets/padlock_50px.svg" alt="padlock">
                <span>Messages are end-to-end encrypted. Only you and ${chat.name} can read them.</span>
            `;
            msgContent.appendChild(encryptionMsg);

            // Add messages
            chat.messages.forEach(message => {
                const msgElement = document.createElement('div');
                msgElement.className = `msg ${message.type}`;
                
                let statusIcon = '';
                if (message.type === 'sent') {
                    statusIcon = '<img src="./assets/double_tick_32px.svg" alt="">';
                }
                
                msgElement.innerHTML = `
                    <p>${message.text}</p>
                    <span class="msg-time">${message.time} ${statusIcon}</span>
                `;
                msgContent.appendChild(msgElement);
            });

            // Add typing indicator if active
            if (chat.isTyping) {
                this.showTypingIndicator(chatId);
            }

            this.scrollToBottom(chatId);
        }

        updateChatHeader(chatId) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const header = document.querySelector(`#${chatId} .msg-name`);
            if (header) {
                header.innerHTML = `
                    <h4>${chat.name}</h4>
                    <span>${chat.status === 'online' ? 'online' : `last seen ${chat.lastSeen}`}</span>
                `;
            }
        }

        markAsRead(chatId) {
            const chat = this.chats.get(chatId);
            if (chat && chat.unread > 0) {
                chat.unread = 0;
                this.renderChatList();
                
                const unreadElement = document.querySelector(`[data-chat="${chatId}"] .unread-count`);
                if (unreadElement) {
                    unreadElement.style.display = 'none';
                }
            }
        }

        // MESSAGE FUNCTIONALITY
        sendMessage(chatId, messageText) {
            if (!messageText.trim()) return;

            const chat = this.chats.get(chatId);
            if (!chat) return;

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Add sent message
            chat.messages.push({
                type: 'sent',
                text: messageText,
                time: timestamp,
                status: 'sent'
            });

            this.renderChatMessages(chatId);
            this.renderChatList();
            this.scrollToBottom(chatId);

            // Clear input
            const input = document.querySelector(`#${chatId} .msg-input`);
            if (input) {
                input.value = '';
                this.updateSendButtonState(input);
            }

            // Simulate typing indicator
            this.showTypingIndicator(chatId);
            
            // Simulate reply after delay
            setTimeout(() => {
                this.simulateReply(chatId);
                this.hideTypingIndicator(chatId);
            }, 1000 + Math.random() * 2000);
        }

        simulateReply(chatId) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const replies = [
                "Okay, sounds good! 👍",
                "I'll get back to you on that",
                "Thanks for letting me know 🙏",
                "Can we discuss this later?",
                "That's great news! 🎉",
                "I understand, thank you",
                "Let me think about it 🤔",
                "Perfect timing! ⏰",
                "I appreciate your message 💝",
                "Looking forward to it! 👀"
            ];

            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Add received message
            chat.messages.push({
                type: 'received',
                text: randomReply,
                time: timestamp,
                status: 'delivered'
            });

            // Update unread count if chat is not active
            if (this.currentChat !== chatId) {
                chat.unread = (chat.unread || 0) + 1;
            }

            this.renderChatMessages(chatId);
            this.renderChatList();
            this.scrollToBottom(chatId);

            // Show notification
            this.showNotification(chat.name, randomReply);
        }

        // TYPING INDICATOR
        showTypingIndicator(chatId) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            chat.isTyping = true;
            
            const msgContent = document.querySelector(`#${chatId} .msg-content`);
            const existingIndicator = msgContent.querySelector('.typing-indicator');
            
            if (!existingIndicator && this.currentChat === chatId) {
                const indicator = document.createElement('div');
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>${chat.name} is typing...</span>
                `;
                msgContent.appendChild(indicator);
                this.scrollToBottom(chatId);
            }
        }

        hideTypingIndicator(chatId) {
            const chat = this.chats.get(chatId);
            if (chat) {
                chat.isTyping = false;
            }
            
            const indicator = document.querySelector(`#${chatId} .typing-indicator`);
            if (indicator) {
                indicator.remove();
            }
        }

        // VOICE MESSAGES
        setupVoiceMessages() {
            this.audioChunks = [];
            
            // Add voice message styles
            const style = document.createElement('style');
            style.textContent = `
                .voice-message {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 15px;
                    background: var(--wa-bubble-outgoing-dark);
                    border-radius: 20px;
                    max-width: 200px;
                    cursor: pointer;
                }
                .voice-waveform {
                    display: flex;
                    gap: 2px;
                    align-items: center;
                    height: 20px;
                }
                .voice-bar {
                    width: 3px;
                    background: var(--wa-green);
                    border-radius: 2px;
                    transition: height 0.3s ease;
                }
                .voice-duration {
                    font-size: 0.8rem;
                    color: var(--wa-text-secondary-dark);
                    min-width: 30px;
                }
                .voice-play-btn {
                    background: none;
                    border: none;
                    color: var(--wa-green);
                    font-size: 1.2rem;
                    cursor: pointer;
                }
                .recording-indicator {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 15px;
                    z-index: 1000;
                    display: none;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.1rem;
                }
                .recording-dot {
                    width: 12px;
                    height: 12px;
                    background: #ff4444;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 15px;
                    background: var(--wa-bubble-incoming-dark);
                    border-radius: 15px;
                    max-width: 120px;
                    margin: 5px 0;
                }
                .typing-dots {
                    display: flex;
                    gap: 3px;
                }
                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: var(--wa-text-secondary-dark);
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }
                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        async startRecording(chatId) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.currentRecordingChat = chatId;

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.sendVoiceMessage(chatId, audioBlob);
                };

                this.mediaRecorder.start();
                this.isRecording = true;
                this.showRecordingIndicator();
            } catch (error) {
                console.error('Error starting recording:', error);
                alert('Microphone access is required for voice messages.');
            }
        }

        stopRecording() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                this.hideRecordingIndicator();
                
                // Stop all tracks
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }

        showRecordingIndicator() {
            let indicator = document.getElementById('recording-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'recording-indicator';
                indicator.className = 'recording-indicator';
                indicator.innerHTML = `
                    <div class="recording-dot"></div>
                    Recording... Release to send
                `;
                document.body.appendChild(indicator);
            }
            indicator.style.display = 'flex';
        }

        hideRecordingIndicator() {
            const indicator = document.getElementById('recording-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }

        sendVoiceMessage(chatId, audioBlob) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const duration = '0:05'; // Simulated duration
            
            // Create voice message element
            chat.messages.push({
                type: 'sent',
                text: '🎤 Voice message',
                time: timestamp,
                status: 'sent',
                isVoice: true,
                duration: duration
            });

            this.renderChatMessages(chatId);
            this.renderChatList();
            this.scrollToBottom(chatId);

            // Simulate voice message reply
            setTimeout(() => {
                this.simulateVoiceReply(chatId);
            }, 2000);
        }

        simulateVoiceReply(chatId) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            chat.messages.push({
                type: 'received',
                text: '🎤 Voice message',
                time: timestamp,
                status: 'delivered',
                isVoice: true,
                duration: '0:03'
            });

            if (this.currentChat !== chatId) {
                chat.unread = (chat.unread || 0) + 1;
            }

            this.renderChatMessages(chatId);
            this.renderChatList();
        }

        // FILE SHARING
        setupFileSharing() {
            // Add file input for attachments
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'file-input';
            fileInput.style.display = 'none';
            fileInput.multiple = true;
            fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
            document.body.appendChild(fileInput);

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
                e.target.value = ''; // Reset input
            });
        }

        handleFileSelection(files) {
            if (!this.currentChat) {
                alert('Please select a chat first');
                return;
            }

            Array.from(files).forEach(file => {
                this.sendFileMessage(this.currentChat, file);
            });
        }

        sendFileMessage(chatId, file) {
            const chat = this.chats.get(chatId);
            if (!chat) return;

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const fileType = this.getFileType(file.type);
            const fileIcon = this.getFileIcon(file.type);
            
            chat.messages.push({
                type: 'sent',
                text: `${fileIcon} ${fileType}: ${file.name}`,
                time: timestamp,
                status: 'sent',
                isFile: true,
                file: file
            });

            this.renderChatMessages(chatId);
            this.renderChatList();
            this.scrollToBottom(chatId);
        }

        getFileType(mimeType) {
            if (mimeType.startsWith('image/')) return 'Image';
            if (mimeType.startsWith('video/')) return 'Video';
            if (mimeType.startsWith('audio/')) return 'Audio';
            if (mimeType === 'application/pdf') return 'PDF';
            if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
            if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Spreadsheet';
            return 'File';
        }

        getFileIcon(mimeType) {
            if (mimeType.startsWith('image/')) return '🖼️';
            if (mimeType.startsWith('video/')) return '🎥';
            if (mimeType.startsWith('audio/')) return '🎵';
            if (mimeType === 'application/pdf') return '📄';
            if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
            return '📎';
        }

        // EMOJI PICKER
        setupEmojiPicker() {
            const emojiCategories = {
                smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
                hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
                animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
                food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
                travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '✈️', '🛩️'],
                objects: ['📱', '💻', '⌚', '📷', '📹', '🎥', '📞', '☎️', '📺', '📻', '🎙️', '📡', '💡', '🔦', '🕯️']
            };

            // Create emoji picker container
            const emojiPicker = document.createElement('div');
            emojiPicker.id = 'emoji-picker';
            emojiPicker.className = 'emoji-picker';
            emojiPicker.style.cssText = `
                position: absolute;
                bottom: 70px;
                left: 10px;
                background: var(--wa-bg-secondary-dark);
                border-radius: 15px;
                padding: 15px;
                display: none;
                flex-wrap: wrap;
                width: 280px;
                gap: 8px;
                z-index: 1000;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                border: 1px solid var(--wa-divider-dark);
                max-height: 300px;
                overflow-y: auto;
            `;

            Object.values(emojiCategories).flat().forEach(emoji => {
                const emojiBtn = document.createElement('button');
                emojiBtn.textContent = emoji;
                emojiBtn.style.cssText = `
                    background: none;
                    border: none;
                    font-size: 1.8rem;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: background 0.2s;
                `;
                emojiBtn.addEventListener('mouseover', () => {
                    emojiBtn.style.background = 'var(--wa-bg-input-dark)';
                });
                emojiBtn.addEventListener('mouseout', () => {
                    emojiBtn.style.background = 'none';
                });
                emojiBtn.addEventListener('click', () => {
                    this.insertEmoji(emoji);
                });
                emojiPicker.appendChild(emojiBtn);
            });

            document.body.appendChild(emojiPicker);
        }

        toggleEmojiPicker() {
            const picker = document.getElementById('emoji-picker');
            if (picker) {
                picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
                this.emojiPickerVisible = !this.emojiPickerVisible;
            }
        }

        insertEmoji(emoji) {
            if (!this.currentChat) return;

            const activeInput = document.querySelector(`#${this.currentChat} .msg-input`);
            if (activeInput) {
                activeInput.value += emoji;
                activeInput.focus();
                this.updateSendButtonState(activeInput);
            }
            this.toggleEmojiPicker();
        }

        // NOTIFICATIONS
        showNotification(title, body) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { 
                    body, 
                    icon: './assets/BARCELONA MESSI.jpeg',
                    tag: 'jibbapp-message'
                });
            } else if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, { body, icon: './assets/BARCELONA MESSI.jpeg' });
                    }
                });
            }

            // Fallback: in-app notification
            this.showInAppNotification(title, body);
        }

        showInAppNotification(title, body) {
            const notification = document.createElement('div');
            notification.className = 'in-app-notification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--wa-bg-secondary-dark);
                color: var(--wa-text-primary-dark);
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1001;
                max-width: 300px;
                border-left: 4px solid var(--wa-green);
                animation: slideIn 0.3s ease;
            `;
            
            notification.innerHTML = `
                <strong>${title}</strong>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.8;">${body}</p>
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }

        // ONLINE STATUS
        setupOnlineStatus() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.showStatusMessage('✅ You are back online');
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.showStatusMessage('⚠️ You are offline');
            });
        }

        showStatusMessage(message) {
            const statusElement = document.createElement('div');
            statusElement.className = 'status-message';
            statusElement.textContent = message;
            statusElement.style.cssText = `
                position: fixed;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--wa-green);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                z-index: 1000;
                font-size: 0.9rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(statusElement);

            setTimeout(() => {
                statusElement.style.opacity = '0';
                statusElement.style.transition = 'opacity 0.3s';
                setTimeout(() => statusElement.remove(), 300);
            }, 3000);
        }

        // SEARCH FUNCTIONALITY
        setupSearch() {
            const searchInput = document.querySelector('#search input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterChats(e.target.value);
                });

                searchInput.addEventListener('focus', () => {
                    searchInput.parentElement.style.background = 'var(--wa-bg-input-dark)';
                });

                searchInput.addEventListener('blur', () => {
                    searchInput.parentElement.style.background = 'var(--wa-bg-input-dark)';
                });
            }
        }

        filterChats(searchTerm) {
            const chats = document.querySelectorAll('.chat');
            const term = searchTerm.toLowerCase();

            chats.forEach(chat => {
                const chatName = chat.querySelector('h4').textContent.toLowerCase();
                const lastMessage = chat.querySelector('p').textContent.toLowerCase();
                
                if (chatName.includes(term) || lastMessage.includes(term)) {
                    chat.style.display = 'flex';
                } else {
                    chat.style.display = 'none';
                }
            });
        }

        // NAVIGATION
        setupNavigation() {
            // Bottom navigation
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    this.handleNavigation(e.currentTarget.querySelector('span').textContent);
                });
            });

            // Chat filter tabs
            const filterButtons = document.querySelectorAll('#nav button');
            filterButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    this.handleFilter(e.currentTarget.textContent);
                });
            });
        }

        handleNavigation(section) {
            // Show appropriate section based on navigation
            const sections = ['Chat', 'Status', 'Community', 'Calls'];
            sections.forEach(sec => {
                const element = document.getElementById(`${sec.toLowerCase()}-section`);
                if (element) {
                    element.style.display = sec === section ? 'block' : 'none';
                }
            });

            // Update main chat visibility
            const mainSection = document.getElementById('main');
            if (mainSection) {
                mainSection.style.display = section === 'Chat' ? 'flex' : 'none';
            }
        }

        handleFilter(filter) {
            const chats = document.querySelectorAll('.chat');
            
            chats.forEach(chat => {
                const unreadCount = chat.querySelector('.unread-count');
                
                switch(filter) {
                    case 'Unread':
                        chat.style.display = unreadCount && parseInt(unreadCount.textContent) > 0 ? 'flex' : 'none';
                        break;
                    case 'Groups':
                        // Simple group detection by name
                        const name = chat.querySelector('h4').textContent;
                        chat.style.display = name.includes('Group') || name.includes('Team') ? 'flex' : 'none';
                        break;
                    case 'Favourites':
                        // Implement favourites logic
                        chat.style.display = chat.dataset.favorite === 'true' ? 'flex' : 'none';
                        break;
                    default:
                        chat.style.display = 'flex';
                }
            });
        }

        // MESSAGE INPUT MANAGEMENT
        setupMessageInput() {
            document.addEventListener('input', (e) => {
                if (e.target.classList.contains('msg-input')) {
                    this.updateSendButtonState(e.target);
                }
            });

            document.addEventListener('keypress', (e) => {
                if (e.target.classList.contains('msg-input') && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessageFromInput(e.target);
                }
            });
        }

        updateSendButtonState(input) {
            const sendBtn = input.closest('.msg-input-area').querySelector('.send-btn');
            if (sendBtn) {
                sendBtn.classList.toggle('typing', input.value.trim() !== '');
            }
        }

        sendMessageFromInput(input) {
            const chatId = input.closest('.jibapp-message').id;
            const message = input.value.trim();
            
            if (message && chatId) {
                this.sendMessage(chatId, message);
            }
        }

        // FLOATING BUTTONS
        setupFloatingButtons() {
            const aiButton = document.getElementById('aiButton');
            const newChatButton = document.getElementById('newChatButton');

            if (aiButton) {
                aiButton.addEventListener('click', () => this.openAIChat());
            }

            if (newChatButton) {
                newChatButton.addEventListener('click', () => this.openNewChatModal());
            }
        }

        openAIChat() {
            const aiChatId = 'ai-chat';
            if (!this.chats.has(aiChatId)) {
                this.chats.set(aiChatId, {
                    name: 'Jibbkol AI',
                    avatar: './assets/BARCELONA MESSI.jpeg',
                    status: 'online',
                    messages: [
                        { 
                            type: 'received', 
                            text: 'Hello! I\'m Jibbkol AI 🤖\n\nI can help you with:\n• Answering questions\n• Providing information\n• Chatting in multiple languages\n• And much more!\n\nHow can I assist you today?', 
                            time: 'Just now', 
                            status: 'read' 
                        }
                    ],
                    unread: 0,
                    lastSeen: 'online',
                    isTyping: false,
                    isAI: true
                });
                this.renderChatList();
            }
            this.showChat(aiChatId);
        }

        openNewChatModal() {
            const contactName = prompt('Enter contact name for new chat:');
            if (contactName && contactName.trim()) {
                const newChatId = 'chat-' + Date.now();
                this.chats.set(newChatId, {
                    name: contactName.trim(),
                    avatar: './assets/BARCELONA MESSI.jpeg',
                    status: 'offline',
                    messages: [
                        { 
                            type: 'received', 
                            text: 'Hi! This is the beginning of your chat with ' + contactName.trim(), 
                            time: 'Just now', 
                            status: 'read' 
                        }
                    ],
                    unread: 0,
                    lastSeen: 'recently',
                    isTyping: false
                });
                this.renderChatList();
                this.showChat(newChatId);
            }
        }

        // MOBILE MENU
        toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const overlay = document.getElementById('overlay');
            
            if (menu && overlay) {
                menu.classList.toggle('show');
                overlay.classList.toggle('show');
            }
        }

        closeMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const overlay = document.getElementById('overlay');
            
            if (menu && overlay) {
                menu.classList.remove('show');
                overlay.classList.remove('show');
            }
        }

        // UTILITY FUNCTIONS
        scrollToBottom(chatId) {
            const msgBody = document.querySelector(`#${chatId} .msg-body`);
            if (msgBody) {
                setTimeout(() => {
                    msgBody.scrollTop = msgBody.scrollHeight;
                }, 100);
            }
        }

        formatTime(date = new Date()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // EVENT LISTENER SETUP
        setupEventListeners() {
            // Mobile menu
            const menuBtn = document.getElementById('menu');
            if (menuBtn) {
                menuBtn.addEventListener('click', () => this.toggleMobileMenu());
            }

            // Overlay click to close menu
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.addEventListener('click', () => this.closeMobileMenu());
            }

            // Dark mode toggle
            const darkModeBtn = document.getElementById('dark-mode');
            if (darkModeBtn) {
                darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
            }

            // Chat list clicks
            document.addEventListener('click', (e) => {
                const chatElement = e.target.closest('.chat');
                if (chatElement && chatElement.dataset.chat) {
                    this.showChat(chatElement.dataset.chat);
                }
            });

            // Back button in chat headers
            document.addEventListener('click', (e) => {
                if (e.target.closest('.msg-back-btn')) {
                    const chatWindow = e.target.closest('.jibapp-message');
                    if (chatWindow) {
                        chatWindow.classList.remove('active');
                        this.currentChat = null;
                    }
                }
            });

            // Send button clicks
            document.addEventListener('click', (e) => {
                const sendBtn = e.target.closest('.send-btn');
                if (sendBtn) {
                    const input = sendBtn.closest('.msg-input-area').querySelector('.msg-input');
                    const chatId = sendBtn.closest('.jibapp-message').id;
                    
                    if (input && input.value.trim() && chatId) {
                        this.sendMessage(chatId, input.value.trim());
                    }
                }
            });

            // Emoji button
            document.addEventListener('click', (e) => {
                if (e.target.closest('.emoji-btn')) {
                    this.toggleEmojiPicker();
                }
            });

            // Voice message recording
            document.addEventListener('mousedown', (e) => {
                if (e.target.closest('.send-btn .mic') && this.currentChat) {
                    this.startRecording(this.currentChat);
                }
            });

            document.addEventListener('mouseup', () => this.stopRecording());
            document.addEventListener('touchstart', (e) => {
                if (e.target.closest('.send-btn .mic') && this.currentChat) {
                    this.startRecording(this.currentChat);
                }
            });
            document.addEventListener('touchend', () => this.stopRecording());

            // File attachment
            document.addEventListener('click', (e) => {
                if (e.target.closest('.attach-btn')) {
                    document.getElementById('file-input').click();
                }
            });

            // Close emoji picker when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
                    const picker = document.getElementById('emoji-picker');
                    if (picker) picker.style.display = 'none';
                }
            });

            // Camera button
            const cameraBtn = document.getElementById('camera');
            if (cameraBtn) {
                cameraBtn.addEventListener('click', () => {
                    alert('Camera feature would open here 📸');
                });
            }

            // Add CSS animations
            this.addGlobalStyles();
        }

        addGlobalStyles() {
            const styles = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .jibapp-message.active {
                    animation: slideIn 0.3s ease;
                }
            `;
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        toggleDarkMode() {
            const newTheme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        }
    }

    // Initialize the app
    window.jibbApp = new JibbApp();
});

// Global utility functions
function exportChat(chatId) {
    if (window.jibbApp && window.jibbApp.chats.has(chatId)) {
        const chat = window.jibbApp.chats.get(chatId);
        const chatData = JSON.stringify(chat, null, 2);
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${chat.name}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

function clearAllChats() {
    if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
        if (window.jibbApp) {
            window.jibbApp.chats.clear();
            window.jibbApp.renderChatList();
            document.querySelectorAll('.jibapp-message').forEach(chat => {
                chat.classList.remove('active');
            });
            window.jibbApp.currentChat = null;
        }
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Make functions globally available
window.exportChat = exportChat;
window.clearAllChats = clearAllChats;
window.toggleFullScreen = toggleFullScreen;