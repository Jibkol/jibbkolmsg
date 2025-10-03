// Enhanced JibbApp JavaScript with all buttons functional and real-time features
document.addEventListener('DOMContentLoaded', function() {
    console.log('JibbApp Enhanced Initializing...');

    // Enhanced Notification System
    const notificationSystem = {
        notifications: [],
        container: null,
        isInitialized: false,

        init: function() {
            this.loadNotifications();
            this.createContainer();
            this.isInitialized = true;
            console.log('Enhanced notification system initialized');
        },

        createContainer: function() {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        },

        loadNotifications: function() {
            try {
                const saved = localStorage.getItem('jibbapp_notifications');
                if (saved) {
                    this.notifications = JSON.parse(saved);
                    const now = Date.now();
                    this.notifications = this.notifications.filter(notification => 
                        (now - notification.timestamp) < (24 * 60 * 60 * 1000)
                    );
                    this.saveNotifications();
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
                this.notifications = [];
            }
        },

        saveNotifications: function() {
            try {
                localStorage.setItem('jibbapp_notifications', JSON.stringify(this.notifications));
            } catch (error) {
                console.error('Error saving notifications:', error);
            }
        },

        addNotification: function(chatId, senderName, message, avatar) {
            if (appState.currentChat === chatId) {
                return;
            }

            const notification = {
                id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                chatId: chatId,
                senderName: senderName,
                message: message,
                avatar: avatar,
                timestamp: Date.now(),
                read: false
            };

            this.notifications.unshift(notification);

            if (this.notifications.length > 50) {
                this.notifications = this.notifications.slice(0, 50);
            }

            this.saveNotifications();
            this.showNotification(notification);
        },

        showNotification: function(notification) {
            if (!this.container) return;

            const notificationElement = document.createElement('div');
            notificationElement.className = 'message-notification';
            notificationElement.setAttribute('data-notification-id', notification.id);
            notificationElement.setAttribute('data-chat-id', notification.chatId);

            notificationElement.innerHTML = `
                <div class="notification-header">
                    <div class="notification-sender">${this.escapeHtml(notification.senderName)}</div>
                    <div class="notification-time">${this.formatRealTime(notification.timestamp)}</div>
                </div>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
            `;

            notificationElement.addEventListener('click', () => {
                this.openChatFromNotification(notification.chatId, notification.id);
            });

            if (this.container.firstChild) {
                this.container.insertBefore(notificationElement, this.container.firstChild);
            } else {
                this.container.appendChild(notificationElement);
            }

            setTimeout(() => {
                this.removeNotification(notification.id);
            }, 5000);
        },

        removeNotification: function(notificationId) {
            const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.add('fade-out');
                setTimeout(() => {
                    if (notificationElement.parentNode) {
                        notificationElement.parentNode.removeChild(notificationElement);
                    }
                }, 300);
            }

            const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
            if (notificationIndex !== -1) {
                this.notifications[notificationIndex].read = true;
                this.saveNotifications();
            }
        },

        openChatFromNotification: function(chatId, notificationId) {
            this.removeNotification(notificationId);
            
            if (typeof openChat === 'function') {
                openChat(chatId);
            }
        },

        clearChatNotifications: function(chatId) {
            this.notifications = this.notifications.filter(notification => notification.chatId !== chatId);
            this.saveNotifications();

            document.querySelectorAll(`[data-chat-id="${chatId}"]`).forEach(element => {
                element.remove();
            });
        },

        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        formatRealTime: function(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

// ==================== PASTE GEMINI AI SERVICE RIGHT HERE ====================
// Real Gemini AI Service
const geminiAIService = {
    // ⚠️ REPLACE THIS WITH YOUR ACTUAL API KEY
    apiKey: 'AIzaSyCFKc-49wPAQaqrYxYRlW8vZVmi_rPevHw',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    
    async getAIResponse(userMessage, conversationHistory = []) {
        try {
            console.log('Sending to Gemini:', userMessage);
            
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are JIBBKOL.AI, a helpful and friendly AI assistant. Keep responses conversational and engaging. Be concise but helpful.

User: ${userMessage}
Assistant:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Gemini Response:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error('Invalid response format from Gemini');
            }
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            return this.getFallbackResponse(userMessage);
        }
    },

    getFallbackResponse(userMessage) {
        // Smart fallback responses
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm JIBBKOL.AI. I'm having some connection issues right now, but I'm still here to chat! How can I help you?";
        } else if (lowerMessage.includes('?')) {
            return "That's a great question! I'm currently experiencing some technical difficulties. Could you try asking again in a moment?";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! I'm glad I could help, even with these temporary connection issues.";
        } else {
            const fallbacks = [
                "Thanks for your message! I'm temporarily operating in limited mode due to connection issues. What else can I help with?",
                "I appreciate your message! I'm currently optimizing my systems. Try again in a moment for a better response!",
                "I'm here to help! I'm experiencing some connectivity issues, but I'm still listening. What would you like to talk about?"
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
};
// ==================== END OF GEMINI SERVICE PASTE ====================

    const appState = {
        currentChat: null,
        chats: [
            {
                id: 'chat1',
                name: 'Jibbkol',
                avatar: './assets/BARCELONA MESSI.jpeg',
                lastMessage: 'Hello, how are you?',
                timestamp: Date.now() - 300000,
                unread: 2,
                online: true,
                type: 'personal'
            },
            {
                id: 'chat2',
                name: 'Sarah Wilson',
                avatar: './assets/profile2.jpg',
                lastMessage: 'Hi! Are we still meeting today?',
                timestamp: Date.now() - 600000,
                unread: 1,
                online: false,
                type: 'personal'
            },
            {
                id: 'chat3',
                name: 'Mike Chen',
                avatar: './assets/profile3.jpg',
                lastMessage: 'Will do, thanks!',
                timestamp: Date.now() - 1200000,
                unread: 7,
                online: true,
                type: 'personal'
            }
        ],
        messages: {
            'chat1': [
                { id: 1, text: 'Hello, how are you?', sender: 'them', timestamp: Date.now() - 300000, read: true },
                { id: 2, text: "I'm good, thanks! How about you?", sender: 'me', timestamp: Date.now() - 240000, read: true }
            ],
            'chat2': [
                { id: 1, text: 'Hi! Are we still meeting today?', sender: 'them', timestamp: Date.now() - 600000, read: true },
                { id: 2, text: 'Yes, 4 PM at the usual place?', sender: 'me', timestamp: Date.now() - 540000, read: true }
            ],
            'chat3': [
                { id: 1, text: 'Hello, how are you?', sender: 'them', timestamp: Date.now() - 1200000, read: true },
                { id: 2, text: "I'm good, thanks! How about you?", sender: 'me', timestamp: Date.now() - 1140000, read: true },
                { id: 3, text: 'Doing well, just working on a project.', sender: 'them', timestamp: Date.now() - 1080000, read: true },
                { id: 4, text: "That's great to hear! Let me know if you need any help.", sender: 'me', timestamp: Date.now() - 1020000, read: true },
                { id: 5, text: 'Will do, thanks!', sender: 'them', timestamp: Date.now() - 960000, read: true }
            ]
        },
        typingUsers: new Set(),
        isRecording: false,
        mediaRecorder: null,
        audioChunks: [],
        cameraStream: null,
        isCameraActive: false
    };

    // Enhanced save/load functions
    function saveMessagesToStorage() {
        try {
            const saveData = {
                chats: appState.chats,
                messages: appState.messages,
                lastSaved: Date.now()
            };
            localStorage.setItem('jibbapp_data', JSON.stringify(saveData));
            console.log('Messages and chats saved to localStorage');
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    function loadMessagesFromStorage() {
        try {
            const savedData = localStorage.getItem('jibbapp_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.chats) appState.chats = data.chats;
                if (data.messages) appState.messages = data.messages;
                console.log('Data loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    function validateChatData() {
        appState.chats.forEach(chat => {
            if (!chat.timestamp) chat.timestamp = Date.now();
            if (!chat.lastMessage) chat.lastMessage = 'No messages yet';
            if (chat.unread === undefined) chat.unread = 0;
            if (!chat.type) chat.type = 'personal';
        });
        
        appState.chats.forEach(chat => {
            if (!appState.messages[chat.id]) {
                appState.messages[chat.id] = [];
            }
        });
    }

    function triggerAutoSave() {
        setTimeout(() => {
            saveMessagesToStorage();
            sortChats();
        }, 100);
    }

    // Initialize the enhanced app
    function init() {
        loadMessagesFromStorage();
        validateChatData();
        
        setupEnhancedEventListeners();
        setupInitialState();
        setupDarkMode();
        sortChats();
        updateChatList();
        
        notificationSystem.init();
        
        console.log('Enhanced JibbApp Initialized Successfully');
        
        // Auto-save every 30 seconds
        setInterval(saveMessagesToStorage, 30000);
    }

    // Enhanced Event Listeners Setup
    function setupEnhancedEventListeners() {
        // Chat item clicks with enhanced feedback
        document.querySelectorAll('.chat').forEach(chatItem => {
            chatItem.addEventListener('click', (e) => {
                chatItem.classList.add('active');
                setTimeout(() => chatItem.classList.remove('active'), 200);
                
                const chatId = chatItem.getAttribute('data-chat');
                openChat(chatId);
            });
        });

        // Back buttons with enhanced feedback
        document.querySelectorAll('.msg-back-btn').forEach(backBtn => {
            backBtn.addEventListener('click', (e) => {
                backBtn.classList.add('active');
                setTimeout(() => backBtn.classList.remove('active'), 200);
                closeCurrentChat();
            });
        });

        // Enhanced Send buttons
        document.querySelectorAll('.send-btn').forEach((sendBtn) => {
            sendBtn.addEventListener('click', (e) => {
                sendBtn.classList.add('active');
                setTimeout(() => sendBtn.classList.remove('active'), 200);
                
                const chatContainer = sendBtn.closest('.jibapp-message');
                if (chatContainer) {
                    const chatId = chatContainer.id;
                    sendMessage(chatId);
                }
            });
        });

        // Enhanced Message input
        document.querySelectorAll('.msg-input').forEach((input) => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const chatContainer = input.closest('.jibapp-message');
                    if (chatContainer) {
                        const chatId = chatContainer.id;
                        sendMessage(chatId);
                    }
                }
            });

            input.addEventListener('input', () => {
                if (input.value.trim().length > 0) {
                    input.closest('.msg-input-area')?.querySelector('.send-btn')?.classList.add('typing');
                } else {
                    input.closest('.msg-input-area')?.querySelector('.send-btn')?.classList.remove('typing');
                }
                handleTyping(input);
            });
        });

        // Enhanced Camera buttons
        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 200);
                toggleCamera();
            });
        });

        // Header camera button
        const headerCamera = document.getElementById('camera');
        if (headerCamera) {
            headerCamera.addEventListener('click', (e) => {
                headerCamera.classList.add('active');
                setTimeout(() => headerCamera.classList.remove('active'), 200);
                toggleCamera();
            });
        }
            // Enhanced Camera button for PC sidebar
            const cameraButtonPC = document.getElementById('camera2');
            if (cameraButtonPC) {
            cameraButtonPC.addEventListener('click', (e) => {
            cameraButtonPC.classList.add('active');
        setTimeout(() => cameraButtonPC.classList.remove('active'), 200);
        toggleCamera();
    });
}
        // Enhanced Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                showEnhancedNotification('Coming soon: ' + btn.querySelector('span').textContent);
            });
        });

        // Enhanced Nav filter buttons
        document.querySelectorAll('#nav button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.textContent === '+') {
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 200);
                    createNewChat();
                    return;
                }
                document.querySelectorAll('#nav button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterChats(btn.textContent);
            });
        });

        // Enhanced Floating buttons
        const aiButton = document.getElementById('aiButton');
        const newChatButton = document.getElementById('newChatButton');
        
        if (aiButton) {
            aiButton.addEventListener('click', (e) => {
                aiButton.classList.add('active');
                setTimeout(() => aiButton.classList.remove('active'), 200);
                createAIChat();
            });
        }
        
        if (newChatButton) {
            newChatButton.addEventListener('click', (e) => {
                newChatButton.classList.add('active');
                setTimeout(() => newChatButton.classList.remove('active'), 200);
                createNewChat();
            });
        }

        // Enhanced Search functionality
        const searchInput = document.querySelector('#search input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // Enhanced Mobile menu
        const menuButton = document.getElementById('menu');
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('overlay');
        
        if (menuButton && mobileMenu && overlay) {
            menuButton.addEventListener('click', (e) => {
                menuButton.classList.add('active');
                setTimeout(() => menuButton.classList.remove('active'), 200);
                mobileMenu.classList.toggle('show');
                overlay.classList.toggle('show');
            });
            
            overlay.addEventListener('click', (e) => {
                mobileMenu.classList.remove('show');
                overlay.classList.remove('show');
            });
        }

        // Enhanced Dark mode toggle
const darkModeButton = document.getElementById('dark-mode');
if (darkModeButton) {
    darkModeButton.addEventListener('click', (e) => {
        darkModeButton.classList.add('active');
        setTimeout(() => darkModeButton.classList.remove('active'), 200);
        toggleDarkMode();
    });
}

// ==== ADD THIS RIGHT HERE ====
// Enhanced Dark mode toggle for PC sidebar
const darkModeButtonPC = document.getElementById('dark-modepc');
if (darkModeButtonPC) {
    darkModeButtonPC.addEventListener('click', (e) => {
        darkModeButtonPC.classList.add('active');
        setTimeout(() => darkModeButtonPC.classList.remove('active'), 200);
        toggleDarkMode();
    });
}
// ==== END OF ADDITION ====

        // Enhanced All other buttons
        document.querySelectorAll('.msg-btn, .btn, .emoji-btn, .attach-btn').forEach(btn => {
            if (!btn.hasAttribute('data-enhanced-listener')) {
                btn.addEventListener('click', (e) => {
                    if (!btn.classList.contains('msg-back-btn')) {
                        btn.classList.add('active');
                        setTimeout(() => btn.classList.remove('active'), 200);
                        
                        if (!btn.classList.contains('send-btn') && 
                            !btn.classList.contains('cam-btn') && 
                            !btn.id.includes('camera')) {
                            showEnhancedNotification('Feature coming soon!');
                        }
                    }
                });
                btn.setAttribute('data-enhanced-listener', 'true');
            }
        });

        // Enhanced Sidebar functionality
        const sidebar = document.getElementById('desktop-sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const menupcbtn = document.getElementById("menu2");
        
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                toggle.classList.add('active');
                setTimeout(() => toggle.classList.remove('active'), 200);
                sidebar.classList.toggle('expanded');
                overlay.classList.add("show");
            });
        }

        if (menupcbtn) {
            menupcbtn.addEventListener('click', () => {
                menupcbtn.classList.add('active');
                setTimeout(() => menupcbtn.classList.remove('active'), 200);
                const pcmenu = document.getElementById("navpc");
                if (pcmenu) {
                    pcmenu.classList.toggle('show');
                    overlay.classList.add("show");
                }
            });
        }

        if (overlay) {
            overlay.addEventListener("click", () => {
                const sidebar = document.getElementById('desktop-sidebar');
                const pcmenu = document.getElementById("navpc");
                const mobileMenu = document.getElementById('mobile-menu');
                
                if (sidebar) sidebar.classList.remove('expanded');
                if (pcmenu) pcmenu.classList.remove('show');
                if (mobileMenu) mobileMenu.classList.remove('show');
                overlay.classList.remove("show");
            });
        }

        // Enhanced Sidebar menu items
        document.querySelectorAll('.sidebar-menu li, .sidebar-nav-bottom li').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!item.querySelector('button')) {
                    item.classList.add('active');
                    setTimeout(() => item.classList.remove('active'), 200);
                    showEnhancedNotification('Coming soon: ' + (item.querySelector('span')?.textContent || 'Feature'));
                }
            });
        });
    }

    // Enhanced Camera Functionality
    async function toggleCamera() {
        if (appState.isCameraActive) {
            stopCamera();
        } else {
            await startCamera();
        }
    }

    async function startCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showEnhancedNotification('Camera not supported in this browser');
                return;
            }

            let cameraModal = document.getElementById('camera-modal');
            if (!cameraModal) {
                cameraModal = document.createElement('div');
                cameraModal.id = 'camera-modal';
                cameraModal.innerHTML = `
                    <div class="camera-container">
                        <div class="camera-header">
                            <button class="camera-close">&times;</button>
                            <span>Camera</span>
                            <button class="camera-switch">🔄</button>
                        </div>
                        <div class="camera-preview">
                            <video id="camera-video" autoplay playsinline></video>
                            <div class="camera-overlay">
                                <div class="camera-controls">
                                    <button class="camera-capture">📸</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(cameraModal);

                cameraModal.querySelector('.camera-close').addEventListener('click', () => {
                    cameraModal.querySelector('.camera-close').classList.add('active');
                    setTimeout(() => cameraModal.querySelector('.camera-close').classList.remove('active'), 200);
                    stopCamera();
                });
                
                cameraModal.querySelector('.camera-switch').addEventListener('click', () => {
                    cameraModal.querySelector('.camera-switch').classList.add('active');
                    setTimeout(() => cameraModal.querySelector('.camera-switch').classList.remove('active'), 200);
                    switchCamera();
                });
                
                cameraModal.querySelector('.camera-capture').addEventListener('click', () => {
                    cameraModal.querySelector('.camera-capture').classList.add('active');
                    setTimeout(() => cameraModal.querySelector('.camera-capture').classList.remove('active'), 200);
                    capturePhoto();
                });
            }

            const constraints = {
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            appState.cameraStream = stream;
            appState.isCameraActive = true;

            const video = cameraModal.querySelector('#camera-video');
            video.srcObject = stream;

            cameraModal.classList.add('active');

        } catch (error) {
            console.error('Error starting camera:', error);
            if (error.name === 'NotAllowedError') {
                showEnhancedNotification('Camera access denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
                showEnhancedNotification('No camera found on this device.');
            } else {
                showEnhancedNotification('Camera error: ' + error.message);
            }
        }
    }

    function stopCamera() {
        if (appState.cameraStream) {
            appState.cameraStream.getTracks().forEach(track => track.stop());
            appState.cameraStream = null;
            appState.isCameraActive = false;
        }

        const cameraModal = document.getElementById('camera-modal');
        if (cameraModal) {
            cameraModal.classList.remove('active');
        }
    }

    async function switchCamera() {
        if (!appState.cameraStream) return;

        try {
            appState.cameraStream.getTracks().forEach(track => track.stop());

            const currentConstraints = appState.cameraStream.getVideoTracks()[0].getSettings();
            const newConstraints = {
                video: {
                    facingMode: currentConstraints.facingMode === 'user' ? 'environment' : 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(newConstraints);
            appState.cameraStream = stream;

            const video = document.querySelector('#camera-video');
            video.srcObject = stream;

        } catch (error) {
            console.error('Error switching camera:', error);
            showEnhancedNotification('Error switching camera');
        }
    }

    function capturePhoto() {
        const video = document.querySelector('#camera-video');
        if (!video || !video.videoWidth) {
            showEnhancedNotification('Camera not ready');
            return;
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const imageUrl = URL.createObjectURL(blob);
                sendPhotoToChat(imageUrl);
                showEnhancedNotification('Photo captured!');
            } else {
                showEnhancedNotification('Error capturing photo');
            }
        }, 'image/jpeg', 0.8);
    }

    function sendPhotoToChat(imageUrl) {
        if (!appState.currentChat) {
            showEnhancedNotification('Open a chat to send photos');
            return;
        }

        const newMessage = {
            id: Date.now(),
            text: '',
            sender: 'me',
            timestamp: Date.now(),
            read: false,
            type: 'image',
            imageUrl: imageUrl
        };

        if (!appState.messages[appState.currentChat]) {
            appState.messages[appState.currentChat] = [];
        }
        appState.messages[appState.currentChat].push(newMessage);
        
        const chat = appState.chats.find(c => c.id === appState.currentChat);
        if (chat) {
            chat.lastMessage = '📷 Photo';
            chat.timestamp = Date.now();
        }

        updateMessageDisplay(appState.currentChat);
        sortChats();
        updateChatList();
        
        triggerAutoSave();
        
        setTimeout(stopCamera, 1000);
    }

    // Enhanced Chat Management
    function openChat(chatId) {
        console.log('Opening chat:', chatId);
        
        document.querySelectorAll('.jibapp-message').forEach(chat => {
            chat.classList.remove('active');
        });

        const selectedChat = document.getElementById(chatId);
        if (selectedChat) {
            selectedChat.classList.add('active');
            appState.currentChat = chatId;
            
            document.querySelectorAll('.chat').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-chat') === chatId) {
                    item.classList.add('active');
                }
            });

            markChatAsRead(chatId);
            scrollToBottom(selectedChat);
            
            if (notificationSystem.isInitialized) {
                notificationSystem.clearChatNotifications(chatId);
            }
            
            console.log('Chat opened successfully');
        } else {
            console.error('Chat not found:', chatId);
        }
    }

    function closeCurrentChat() {
        document.querySelectorAll('.jibapp-message').forEach(chat => {
            chat.classList.remove('active');
        });
        appState.currentChat = null;
        
        document.querySelectorAll('.chat').forEach(item => {
            item.classList.remove('active');
        });
    }

    function markChatAsRead(chatId) {
        const chat = appState.chats.find(c => c.id === chatId);
        if (chat && chat.unread > 0) {
            chat.unread = 0;
            updateChatList();
            triggerAutoSave();
        }
    }

    // Enhanced Message Handling with Real-time Feel
    function sendMessage(chatId) {
        if (!chatId) {
            showEnhancedNotification('Please select a chat first');
            return;
        }

        const chatElement = document.getElementById(chatId);
        if (!chatElement) {
            showEnhancedNotification('Chat not found');
            return;
        }

        const input = chatElement.querySelector('.msg-input');
        if (!input) {
            console.error('Message input not found for chat:', chatId);
            return;
        }

        const messageText = input.value.trim();

        if (!messageText) {
            toggleAudioRecording(chatElement);
            return;
        }

        const newMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'me',
            timestamp: Date.now(),
            read: false
        };

        if (!appState.messages[chatId]) {
            appState.messages[chatId] = [];
        }
        appState.messages[chatId].push(newMessage);
        
        const chat = appState.chats.find(c => c.id === chatId);
        if (chat) {
            chat.lastMessage = messageText;
            chat.timestamp = Date.now();
            chat.unread = 0;
        }

        updateMessageDisplay(chatId);
        input.value = '';
        
        const sendBtn = chatElement.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.classList.remove('typing');
        }
        
        triggerAutoSave();

        // Enhanced Real-time Reply Simulation
        simulateEnhancedReply(chatId, messageText);
    }

    function toggleAudioRecording(chatElement) {
        if (!appState.isRecording) {
            startAudioRecording(chatElement);
        } else {
            stopAudioRecording();
        }
    }

    async function startAudioRecording(chatElement) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            appState.mediaRecorder = new MediaRecorder(stream);
            appState.audioChunks = [];

            appState.mediaRecorder.ondataavailable = (event) => {
                appState.audioChunks.push(event.data);
            };

            appState.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(appState.audioChunks, { type: 'audio/wav' });
                console.log('Audio recorded:', audioBlob);
                showEnhancedNotification('Audio message recorded');
                sendAudioMessage(audioBlob);
            };

            appState.mediaRecorder.start();
            appState.isRecording = true;

            const sendBtn = chatElement.querySelector('.send-btn');
            if (sendBtn) {
                sendBtn.style.background = '#ff4444';
            }
            showEnhancedNotification('Recording audio...');

        } catch (err) {
            console.error('Error recording audio:', err);
            showEnhancedNotification('Microphone access denied');
        }
    }

    function stopAudioRecording() {
        if (appState.mediaRecorder && appState.isRecording) {
            appState.mediaRecorder.stop();
            appState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            appState.isRecording = false;
            
            document.querySelectorAll('.send-btn').forEach(btn => {
                btn.style.background = '';
            });
        }
    }

    function sendAudioMessage(audioBlob) {
        if (!appState.currentChat) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const newMessage = {
            id: Date.now(),
            text: '',
            sender: 'me',
            timestamp: Date.now(),
            read: false,
            type: 'audio',
            audioUrl: audioUrl
        };

        if (!appState.messages[appState.currentChat]) {
            appState.messages[appState.currentChat] = [];
        }
        appState.messages[appState.currentChat].push(newMessage);
        
        const chat = appState.chats.find(c => c.id === appState.currentChat);
        if (chat) {
            chat.lastMessage = '🎤 Audio message';
            chat.timestamp = Date.now();
        }

        updateMessageDisplay(appState.currentChat);
        sortChats();
        updateChatList();
        
        triggerAutoSave();
    }

    // Enhanced Real-time Reply with Actual Gemini AI
async function simulateEnhancedReply(chatId, userMessage) {
    console.log('🔍 Checking if this is an AI chat:', chatId);
    
    // Check if this is an AI chat (chat ID contains 'ai-chat')
    if (chatId.includes('ai-chat')) {
        console.log('🤖 AI chat detected, processing with Gemini...');
        
        // Wait 1 second before showing "typing..." indicator
        setTimeout(async () => {
            const chatElement = document.getElementById(chatId);
            if (chatElement) {
                updateTypingIndicator(chatElement, true);
            }
            
            try {
                console.log('📡 Sending message to Gemini API...');
                
                // Get real AI response from Gemini
                const aiResponse = await geminiAIService.getAIResponse(userMessage);
                
                console.log('✅ Gemini response received:', aiResponse);
                
                // Create the reply message object
                const replyMessage = {
                    id: Date.now(),
                    text: aiResponse,
                    sender: 'them',
                    timestamp: Date.now(),
                    read: false
                };

                // Make sure messages array exists for this chat
                if (!appState.messages[chatId]) {
                    appState.messages[chatId] = [];
                }
                
                // Add the AI response to messages
                appState.messages[chatId].push(replyMessage);

                // Hide the typing indicator
                updateTypingIndicator(chatElement, false);
                
                // Update the chat info with the last message
                const chat = appState.chats.find(c => c.id === chatId);
                if (chat) {
                    // Shorten long messages for the chat list preview
                    chat.lastMessage = aiResponse.length > 35 ? 
                        aiResponse.substring(0, 35) + '...' : aiResponse;
                    chat.timestamp = Date.now();
                }

                // Refresh the message display
                updateMessageDisplay(chatId);
                triggerAutoSave();
                sortChats();
                updateChatList();
                
                // Show notification if needed
                if (chat && notificationSystem.isInitialized) {
                    notificationSystem.addNotification(
                        chatId,
                        chat.name,
                        aiResponse,
                        chat.avatar
                    );
                }

                console.log('🎉 AI response displayed successfully');

            } catch (error) {
                console.error('❌ AI Response Error:', error);
                updateTypingIndicator(chatElement, false);
                // Fallback to simulated response if Gemini fails
                sendSimulatedReply(chatId, userMessage, chatElement);
            }
            
        }, 1000); // Wait 1 second before AI starts "typing"
        return;
    }

    // Regular chat replies (keep existing simulated behavior for non-AI chats)
    console.log('💬 Regular chat, using simulated replies');
    sendSimulatedReply(chatId, userMessage);
}

// Keep your existing sendSimulatedReply function but make sure it's available
function sendSimulatedReply(chatId, userMessage, chatElement = null) {
    // Your existing simulated reply code for regular chats
    setTimeout(() => {
        if (chatElement) {
            updateTypingIndicator(chatElement, true);
        }
        
        const typingDuration = 1000 + Math.random() * 2000 + (userMessage.length * 10);
        
        setTimeout(() => {
            let replies;
            
            if (userMessage.toLowerCase().includes('?')) {
                replies = [
                    "That's a good question! Let me think...",
                    "I'm not sure about that, but I can find out.",
                    "Interesting question! What made you ask that?",
                    "I'd need to check on that and get back to you.",
                    "That depends on a few factors, actually."
                ];
            } else if (userMessage.length < 10) {
                replies = [
                    "Okay!",
                    "Got it!",
                    "I see!",
                    "Alright!",
                    "Sure!"
                ];
            } else {
                replies = [
                    "That's interesting!",
                    "I see what you mean",
                    "Let me think about that...",
                    "Thanks for sharing!",
                    "I agree with you",
                    "That makes sense",
                    "Tell me more about that",
                    "I appreciate your perspective",
                    "That's a good point",
                    "I understand completely"
                ];
            }

            const replyMessage = {
                id: Date.now(),
                text: replies[Math.floor(Math.random() * replies.length)],
                sender: 'them',
                timestamp: Date.now(),
                read: false
            };

            if (!appState.messages[chatId]) {
                appState.messages[chatId] = [];
            }
            appState.messages[chatId].push(replyMessage);

            updateTypingIndicator(chatElement, false);
            
            const chat = appState.chats.find(c => c.id === chatId);
            if (chat) {
                chat.lastMessage = replyMessage.text;
                chat.timestamp = Date.now();
                chat.unread = (chat.unread || 0) + 1;
            }

            updateMessageDisplay(chatId);
            triggerAutoSave();
            sortChats();
            updateChatList();
            
            if (chat && notificationSystem.isInitialized) {
                notificationSystem.addNotification(
                    chatId,
                    chat.name,
                    replyMessage.text,
                    chat.avatar
                );
            }
        }, typingDuration);
            
    }, 800 + Math.random() * 1200);
}

    function updateMessageDisplay(chatId) {
        const chatElement = document.getElementById(chatId);
        if (!chatElement) {
            console.error('Chat element not found:', chatId);
            return;
        }

        const msgContent = chatElement.querySelector('.msg-content');
        if (!msgContent) {
            console.error('Message content not found in chat:', chatId);
            return;
        }

        const messages = appState.messages[chatId] || [];

        const encryptionMsg = msgContent.querySelector('.encryption-message');
        msgContent.innerHTML = '';
        if (encryptionMsg) {
            msgContent.appendChild(encryptionMsg);
        }

        messages.forEach(msg => {
            const msgElement = document.createElement('div');
            msgElement.className = `msg ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            if (msg.type === 'image') {
                msgElement.innerHTML = `
                    <div class="message-image">
                        <img src="${msg.imageUrl}" alt="Sent photo" style="max-width: 200px; border-radius: 8px;">
                    </div>
                    <span class="msg-time">
                        ${formatRealTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            } else if (msg.type === 'audio') {
                msgElement.innerHTML = `
                    <div class="message-audio">
                        <audio controls src="${msg.audioUrl}"></audio>
                    </div>
                    <span class="msg-time">
                        ${formatRealTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            } else {
                msgElement.innerHTML = `
                    <p>${escapeHtml(msg.text)}</p>
                    <span class="msg-time">
                        ${formatRealTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            }
            
            msgContent.appendChild(msgElement);
        });

        scrollToBottom(chatElement);
    }

    // Enhanced AI Chat Functionality
    function createAIChat() {
        const aiChatId = 'ai-chat-' + Date.now();
        const aiChat = {
            id: aiChatId,
            name: 'JIBBKOL.AI',
            avatar: '🤖',
            lastMessage: 'Hello! I am JIBBKOL.AI. How can I help you today?',
            timestamp: Date.now(),
            unread: 0,
            online: true,
            type: 'ai'
        };

        appState.chats.unshift(aiChat);
        appState.messages[aiChatId] = [{
            id: 1,
            text: aiChat.lastMessage,
            sender: 'them',
            timestamp: Date.now(),
            read: false
        }];
        
        triggerAutoSave();

        const chatHTML = `
            <div class="jibapp-message" id="${aiChatId}">
                <header class="msg-header">
                    <div class="msg-profile">
                        <button class="msg-back-btn"><img src="./assets/back_50px.svg"></button>
                        <div class="msg-pfp" style="width: 40px; height: 40px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 20px;">🤖</div>
                        <div class="msg-name">
                            <h4>JIBBKOL.AI</h4>
                            <span>online</span>
                        </div>
                    </div>
                    <div class="msg-btns">
                        <button class="msg-btn"><img src="./assets/phone_50px.svg"></button>
                        <button class="msg-btn"><img src="./assets/video_call_50px.svg"></button>
                        <button class="msg-btn"><img src="./assets/menu_vertical_24px.svg"></button>
                    </div>
                </header>
                <div class="msg-body">
                    <div class="msg-content">
                        <div class="encryption-message">
                            <img src="./assets/padlock_50px.svg" alt="padlock">
                            <span>Messages are end-to-end encrypted. Only you and JIBBKOL.AI can read them.</span>
                        </div>
                    </div>
                </div>
                <div class="msg-input-area">
                    <div class="msg-input-wrap">
                        <button class="emoji-btn"><img src="./assets/happy_80px.svg" alt="emoji"></button>
                        <input type="text" class="msg-input" placeholder="Ask JIBBKOL.AI...">
                        <button class="attach-btn"><img src="./assets/attach_24px.svg" alt="attach"></button>
                        <button class="cam-btn"><img src="./assets/unsplash_32px.svg" alt="camera"></button>
                    </div>
                    <button class="send-btn">
                        <img src="./assets/microphone_24px.svg" alt="mic" class="mic">
                        <img src="./assets/paper_plane_30px.svg" alt="send" class="send">
                    </button>
                </div>
            </div>
        `;
        
        const chatInner = document.getElementById('chat-inner');
        if (chatInner) {
            chatInner.insertAdjacentHTML('beforeend', chatHTML);
        }
        
        const chatItemHTML = `
            <div class="chat" data-chat="${aiChatId}">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 24px;">🤖</div>
                <div class="chat-info">
                    <h4>JIBBKOL.AI</h4>
                    <p>Hello! I am JIBBKOL.AI. How can I help you today?</p>
                </div>
                <div class="chat-time">
                    <span>${formatRealTime(Date.now())}</span>
                </div>
            </div>
        `;
        
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.insertAdjacentHTML('afterbegin', chatItemHTML);
        }
        
        setupEnhancedEventListeners();
        sortChats();
        updateChatList();
        openChat(aiChatId);
        showEnhancedNotification('AI chat started with JIBBKOL.AI');
        
        triggerAutoSave();
    }

    // Enhanced New Chat Creation
    function createNewChat() {
        const contactName = prompt('Enter contact name:');
        if (!contactName || contactName.trim() === '') {
            return;
        }

        const newChatId = 'chat-' + Date.now();
        const newChat = {
            id: newChatId,
            name: contactName.trim(),
            avatar: './assets/BARCELONA MESSI.jpeg',
            lastMessage: 'Chat started',
            timestamp: Date.now(),
            unread: 0,
            online: true,
            type: 'personal'
        };

        appState.chats.unshift(newChat);
        appState.messages[newChatId] = [{
            id: 1,
            text: 'Chat started',
            sender: 'system',
            timestamp: Date.now(),
            read: true
        }];
        
        triggerAutoSave();

        const chatHTML = `
            <div class="jibapp-message" id="${newChatId}">
                <header class="msg-header">
                    <div class="msg-profile">
                        <button class="msg-back-btn"><img src="./assets/back_50px.svg"></button>
                        <img src="./assets/BARCELONA MESSI.jpeg" alt="profile" class="msg-pfp">
                        <div class="msg-name">
                            <h4>${escapeHtml(contactName.trim())}</h4>
                            <span>online</span>
                        </div>
                    </div>
                    <div class="msg-btns">
                        <button class="msg-btn"><img src="./assets/phone_50px.svg"></button>
                        <button class="msg-btn"><img src="./assets/video_call_50px.svg"></button>
                        <button class="msg-btn"><img src="./assets/menu_vertical_24px.svg"></button>
                    </div>
                </header>
                <div class="msg-body">
                    <div class="msg-content">
                        <div class="encryption-message">
                            <img src="./assets/padlock_50px.svg" alt="padlock">
                            <span>Messages are end-to-end encrypted. Only you and ${escapeHtml(contactName.trim())} can read them.</span>
                        </div>
                    </div>
                </div>
                <div class="msg-input-area">
                    <div class="msg-input-wrap">
                        <button class="emoji-btn"><img src="./assets/happy_80px.svg" alt="emoji"></button>
                        <input type="text" class="msg-input" placeholder="Type a message">
                        <button class="attach-btn"><img src="./assets/attach_24px.svg" alt="attach"></button>
                        <button class="cam-btn"><img src="./assets/unsplash_32px.svg" alt="camera"></button>
                    </div>
                    <button class="send-btn">
                        <img src="./assets/microphone_24px.svg" alt="mic" class="mic">
                        <img src="./assets/paper_plane_30px.svg" alt="send" class="send">
                    </button>
                </div>
            </div>
        `;
        
        const chatInner = document.getElementById('chat-inner');
        if (chatInner) {
            chatInner.insertAdjacentHTML('beforeend', chatHTML);
        }
        
        const chatItemHTML = `
            <div class="chat" data-chat="${newChatId}">
                <img src="./assets/BARCELONA MESSI.jpeg" alt="profile">
                <div class="chat-info">
                    <h4>${escapeHtml(contactName.trim())}</h4>
                    <p>Chat started</p>
                </div>
                <div class="chat-time">
                    <span>${formatRealTime(Date.now())}</span>
                </div>
            </div>
        `;
        
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.insertAdjacentHTML('afterbegin', chatItemHTML);
        }
        
        setupEnhancedEventListeners();
        sortChats();
        updateChatList();
        openChat(newChatId);
        showEnhancedNotification(`New chat created with ${contactName.trim()}`);
        
        triggerAutoSave();
    }

    // Enhanced UI Updates
    function updateChatList() {
        const chatItems = document.querySelectorAll('.chat');
        chatItems.forEach(item => {
            const chatId = item.getAttribute('data-chat');
            const chat = appState.chats.find(c => c.id === chatId);
            
            if (chat) {
                const lastMessage = item.querySelector('.chat-info p');
                const time = item.querySelector('.chat-time span:first-child');
                let unread = item.querySelector('.unread-count');
                
                if (lastMessage) lastMessage.textContent = chat.lastMessage;
                if (time) time.textContent = formatRealTime(chat.timestamp);
                
                if (chat.unread > 0) {
                    if (!unread) {
                        unread = document.createElement('span');
                        unread.className = 'unread-count';
                        item.querySelector('.chat-time').appendChild(unread);
                    }
                    unread.textContent = chat.unread;
                    unread.style.display = 'flex';
                } else if (unread) {
                    unread.style.display = 'none';
                }
            }
        });
    }

    function sortChats() {
        appState.chats.sort((a, b) => b.timestamp - a.timestamp);
        
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            const chatElements = Array.from(chatsList.querySelectorAll('.chat'));
            
            chatElements.sort((a, b) => {
                const chatAId = a.getAttribute('data-chat');
                const chatBId = b.getAttribute('data-chat');
                const indexA = appState.chats.findIndex(chat => chat.id === chatAId);
                const indexB = appState.chats.findIndex(chat => chat.id === chatBId);
                return indexA - indexB;
            });
            
            chatElements.forEach(chatElement => {
                chatsList.appendChild(chatElement);
            });
        }
        
        updateChatList();
    }

    function filterChats(filter) {
        const chatItems = document.querySelectorAll('.chat');
        
        chatItems.forEach(item => {
            const chatId = item.getAttribute('data-chat');
            const chat = appState.chats.find(c => c.id === chatId);
            
            if (!chat) return;
            
            switch (filter) {
                case 'All':
                    item.style.display = 'flex';
                    break;
                case 'Unread':
                    item.style.display = chat.unread > 0 ? 'flex' : 'none';
                    break;
                case 'Groups':
                    item.style.display = chat.type === 'group' ? 'flex' : 'none';
                    break;
                case 'Favourites':
                    item.style.display = chat.favorite ? 'flex' : 'none';
                    break;
                default:
                    item.style.display = 'flex';
            }
        });
    }

    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const chatItems = document.querySelectorAll('.chat');
        
        if (query === '') {
            chatItems.forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }
        
        chatItems.forEach(item => {
            const nameElement = item.querySelector('h4');
            const lastMessageElement = item.querySelector('p');
            
            if (nameElement && lastMessageElement) {
                const name = nameElement.textContent.toLowerCase();
                const lastMessage = lastMessageElement.textContent.toLowerCase();
                
                if (name.includes(query) || lastMessage.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    function toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('overlay');
        
        if (mobileMenu && overlay) {
            mobileMenu.classList.toggle('show');
            overlay.classList.toggle('show');
        }
    }

    function closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('overlay');
        
        if (mobileMenu && overlay) {
            mobileMenu.classList.remove('show');
            overlay.classList.remove('show');
        }
    }
function setupDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') !== 'false'; // Default to dark mode
    const darkIcon = document.getElementById('dark-icon');
    const lightIcon = document.getElementById('light-icon');
    const darkIconPC = document.getElementById('dark-iconpc');
    const lightIconPC = document.getElementById('light-iconpc');
    
    if (!isDarkMode) {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        if (darkIcon) darkIcon.style.display = 'none';
        if (lightIcon) lightIcon.style.display = 'block';
        if (darkIconPC) darkIconPC.style.display = 'none';
        if (lightIconPC) lightIconPC.style.display = 'block';
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (darkIcon) darkIcon.style.display = 'block';
        if (lightIcon) lightIcon.style.display = 'none';
        if (darkIconPC) darkIconPC.style.display = 'block';
        if (lightIconPC) lightIconPC.style.display = 'none';
    }
}
function toggleDarkMode() {
    const isCurrentlyDark = !document.body.classList.contains('light-mode');
    const darkIcon = document.getElementById('dark-icon');
    const lightIcon = document.getElementById('light-icon');
    const darkIconPC = document.getElementById('dark-iconpc');
    const lightIconPC = document.getElementById('light-iconpc');
    
    if (isCurrentlyDark) {
        // Switch to LIGHT mode
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        if (darkIcon) darkIcon.style.display = 'none';
        if (lightIcon) lightIcon.style.display = 'block';
        if (darkIconPC) darkIconPC.style.display = 'none';
        if (lightIconPC) lightIconPC.style.display = 'block';
        showEnhancedNotification('Light mode enabled');
    } else {
        // Switch to DARK mode
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (darkIcon) darkIcon.style.display = 'block';
        if (lightIcon) lightIcon.style.display = 'none';
        if (darkIconPC) darkIconPC.style.display = 'block';
        if (lightIconPC) lightIconPC.style.display = 'none';
        showEnhancedNotification('Dark mode enabled');
    }
    
    // Save preference - store 'false' for light mode, 'true' for dark mode
    localStorage.setItem('darkMode', isCurrentlyDark ? 'false' : 'true');
}
    // Enhanced Utility Functions
    function scrollToBottom(chatElement) {
        setTimeout(() => {
            const msgBody = chatElement.querySelector('.msg-body');
            if (msgBody) {
                msgBody.scrollTop = msgBody.scrollHeight;
            }
        }, 100);
    }

    function formatRealTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Enhanced Notification System
    function showEnhancedNotification(message) {
        document.querySelectorAll('.custom-notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .custom-notification {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-100px);
                    background: #25D366;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    z-index: 10000;
                    transition: transform 0.3s ease;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    max-width: 300px;
                    text-align: center;
                    font-size: 14px;
                }
                .custom-notification.show {
                    transform: translateX(-50%) translateY(0);
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function handleTyping(input) {
        if (!appState.currentChat) return;
        
        const chatElement = document.getElementById(appState.currentChat);
        if (chatElement) {
            updateTypingIndicator(chatElement, input.value.length > 0);
            
            if (window.typingTimeout) clearTimeout(window.typingTimeout);
            
            window.typingTimeout = setTimeout(() => {
                updateTypingIndicator(chatElement, false);
            }, 1000);
        }
    }

    function updateTypingIndicator(chatElement, isTyping) {
        let indicator = chatElement.querySelector('.typing-indicator');
        
        if (isTyping) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>typing...</span>
                `;
                const msgContent = chatElement.querySelector('.msg-content');
                if (msgContent) {
                    msgContent.appendChild(indicator);
                    scrollToBottom(chatElement);
                }
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }

    function setupInitialState() {
        const firstChat = document.querySelector('.chat');
        if (firstChat) {
            firstChat.classList.add('active');
        }
        
        document.querySelectorAll('.chat').forEach(item => {
            item.style.cursor = 'pointer';
        });

        updateChatList();
    }

    // Initialize the enhanced app
    init();

});


// Enhanced Nav filter buttons - close overlay when clicked
document.querySelectorAll('#nav button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.textContent === '+') {
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 200);
            createNewChat();
            // Close overlay when creating new chat
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.remove('show');
            return;
        }
        document.querySelectorAll('#nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterChats(btn.textContent);
        
        // Close overlay when filter is selected
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.remove('show');
        const nav = document.getElementById('nav');
        if (nav) nav.classList.remove('show');
    });
});