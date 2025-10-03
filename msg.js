
// msg.js - Fixed Version Compatible with Your HTML/CSS
document.addEventListener('DOMContentLoaded', function() {
    console.log('JibbApp Initializing...');

    // Notification System
    const notificationSystem = {
        notifications: [],
        container: null,
        isInitialized: false,

        // Initialize notification system
        init: function() {
            this.loadNotifications();
            this.createContainer();
            this.isInitialized = true;
            console.log('Notification system initialized');
        },

        // Create notification container
        createContainer: function() {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);

            // Add notification styles
            if (!document.querySelector('#notification-system-styles')) {
                const styles = document.createElement('style');
                styles.id = 'notification-system-styles';
                styles.textContent = `
                    .notifications-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10002;
                        max-width: 350px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .message-notification {
                        background: linear-gradient(135deg, #25D366, #128C7E);
                        color: white;
                        padding: 15px;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                        max-width: 100%;
                        animation: notificationSlideIn 0.3s ease-out;
                        transition: all 0.3s ease;
                        cursor: pointer;
                        border-left: 4px solid #128C7E;
                    }

                    .message-notification.fade-out {
                        animation: notificationSlideOut 0.3s ease-in forwards;
                    }

                    .notification-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                    }

                    .notification-sender {
                        font-weight: 600;
                        font-size: 14px;
                        color: white;
                    }

                    .notification-time {
                        font-size: 11px;
                        opacity: 0.9;
                        color: rgba(255, 255, 255, 0.9);
                    }

                    .notification-message {
                        font-size: 13px;
                        line-height: 1.4;
                        opacity: 0.95;
                        word-wrap: break-word;
                    }

                    .notification-close {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        opacity: 0.7;
                        padding: 2px;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .notification-close:hover {
                        opacity: 1;
                        background: rgba(255, 255, 255, 0.2);
                    }

                    @keyframes notificationSlideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    @keyframes notificationSlideOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                    }

                    @media (max-width: 768px) {
                        .notifications-container {
                            top: 10px;
                            right: 10px;
                            left: 10px;
                            max-width: none;
                        }
                    }
                `;
                document.head.appendChild(styles);
            }
        },

        // Load notifications from localStorage
        loadNotifications: function() {
            try {
                const saved = localStorage.getItem('jibbapp_notifications');
                if (saved) {
                    this.notifications = JSON.parse(saved);
                    // Filter out expired notifications (older than 24 hours)
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

        // Save notifications to localStorage
        saveNotifications: function() {
            try {
                localStorage.setItem('jibbapp_notifications', JSON.stringify(this.notifications));
            } catch (error) {
                console.error('Error saving notifications:', error);
            }
        },

        // Add a new notification
        addNotification: function(chatId, senderName, message, avatar) {
            // Don't show notification if the chat is currently active
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

            // Add to the beginning of the array (newest first)
            this.notifications.unshift(notification);

            // Keep only last 50 notifications
            if (this.notifications.length > 50) {
                this.notifications = this.notifications.slice(0, 50);
            }

            this.saveNotifications();
            this.showNotification(notification);
        },

        // Show notification in UI
        showNotification: function(notification) {
            if (!this.container) return;

            const notificationElement = document.createElement('div');
            notificationElement.className = 'message-notification';
            notificationElement.setAttribute('data-notification-id', notification.id);
            notificationElement.setAttribute('data-chat-id', notification.chatId);

            notificationElement.innerHTML = `
                <div class="notification-header">
                    <div class="notification-sender">${this.escapeHtml(notification.senderName)}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
            `;

            // Add click handler to open chat
            notificationElement.addEventListener('click', () => {
                this.openChatFromNotification(notification.chatId, notification.id);
            });

            // Add to container (top of the list)
            if (this.container.firstChild) {
                this.container.insertBefore(notificationElement, this.container.firstChild);
            } else {
                this.container.appendChild(notificationElement);
            }

            // Auto-remove after 5 seconds
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, 5000);
        },

        // Remove notification from UI and mark as read
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

            // Mark as read in storage
            const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
            if (notificationIndex !== -1) {
                this.notifications[notificationIndex].read = true;
                this.saveNotifications();
            }
        },

        // Open chat when notification is clicked
        openChatFromNotification: function(chatId, notificationId) {
            // Remove the notification immediately
            this.removeNotification(notificationId);
            
            // Open the chat
            if (typeof openChat === 'function') {
                openChat(chatId);
            }
        },

        // Clear all notifications for a specific chat
        clearChatNotifications: function(chatId) {
            this.notifications = this.notifications.filter(notification => notification.chatId !== chatId);
            this.saveNotifications();

            // Remove from UI
            document.querySelectorAll(`[data-chat-id="${chatId}"]`).forEach(element => {
                element.remove();
            });
        },

        // Utility function to escape HTML
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        // Format time for notification
        formatTime: function(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString();
        }
    };

    // App State
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
                online: true
            },
            {
                id: 'chat2',
                name: 'Sarah Wilson',
                avatar: './assets/profile2.jpg',
                lastMessage: 'Hi! Are we still meeting today?',
                timestamp: Date.now() - 600000,
                unread: 1,
                online: false
            },
            {
                id: 'chat3',
                name: 'Mike Chen',
                avatar: './assets/profile3.jpg',
                lastMessage: 'Will do, thanks!',
                timestamp: Date.now() - 1200000,
                unread: 7,
                online: true
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
        // Save messages to localStorage
    function saveMessagesToStorage() {
        try {
            localStorage.setItem('jibbapp_messages', JSON.stringify(appState.messages));
            localStorage.setItem('jibbapp_chats', JSON.stringify(appState.chats));
            console.log('Messages saved to localStorage');
        } catch (error) {
            console.error('Error saving messages to storage:', error);
        }
    }

    // Load messages from localStorage
    function loadMessagesFromStorage() {
        try {
            const savedMessages = localStorage.getItem('jibbapp_messages');
            const savedChats = localStorage.getItem('jibbapp_chats');
            
            if (savedMessages) {
                appState.messages = JSON.parse(savedMessages);
                console.log('Messages loaded from localStorage');
            }
            if (savedChats) {
                appState.chats = JSON.parse(savedChats);
                console.log('Chats loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading messages from storage:', error);
        }
    }

    // Initialize the app
    function init() {
        // LOAD MESSAGES FROM STORAGE - ADD THIS LINE
        loadMessagesFromStorage();
        
        setupEventListeners();
        setupInitialState();
        setupDarkMode();
        updateChatList();
        
        // Initialize notification system
        notificationSystem.init();
        
        console.log('JibbApp Initialized Successfully');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Chat item clicks - FIXED: Using proper CSS classes from your HTML
        document.querySelectorAll('.chat').forEach(chatItem => {
            chatItem.addEventListener('click', (e) => {
                const chatId = chatItem.getAttribute('data-chat');
                openChat(chatId);
            });
        });

        // Back buttons - FIXED: Using proper class names
        document.querySelectorAll('.msg-back-btn').forEach(backBtn => {
            backBtn.addEventListener('click', (e) => {
                closeCurrentChat();
            });
        });

        // Send buttons - FIXED: Handle both mobile and desktop
        document.querySelectorAll('.send-btn').forEach((sendBtn) => {
            sendBtn.addEventListener('click', (e) => {
                // Find which chat input belongs to this send button
                const chatContainer = sendBtn.closest('.jibapp-message');
                if (chatContainer) {
                    const input = chatContainer.querySelector('.msg-input');
                    const chatIndex = Array.from(document.querySelectorAll('.jibapp-message')).indexOf(chatContainer);
                    sendMessage(chatIndex);
                }
            });
        });

        // Message input enter key - FIXED: Proper input handling
        document.querySelectorAll('.msg-input').forEach((input, index) => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(index);
                }
            });

            // Typing indicator - FIXED: Proper typing detection
            input.addEventListener('input', () => {
                if (input.value.trim().length > 0) {
                    input.closest('.msg-input-area')?.querySelector('.send-btn')?.classList.add('typing');
                } else {
                    input.closest('.msg-input-area')?.querySelector('.send-btn')?.classList.remove('typing');
                }
                handleTyping(input);
            });
        });

        // Camera buttons - FIXED: Proper camera button handling
        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                toggleCamera();
            });
        });

        // Header camera button - FIXED: Check if element exists
        const headerCamera = document.getElementById('camera');
        if (headerCamera) {
            headerCamera.addEventListener('click', (e) => {
                toggleCamera();
            });
        }

        // Bottom navigation - FIXED: Use 'show' class instead of 'active'
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                showNotification('Coming soon: ' + e.currentTarget.querySelector('span').textContent);
            });
        });

        // Nav filter buttons - FIXED: Proper filtering
        document.querySelectorAll('#nav button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.textContent === '+') {
                    createNewChat();
                    return;
                }
                document.querySelectorAll('#nav button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                filterChats(e.target.textContent);
            });
        });

        // Floating buttons - FIXED: Check if elements exist
        const aiButton = document.getElementById('aiButton');
        const newChatButton = document.getElementById('newChatButton');
        
        if (aiButton) {
            aiButton.addEventListener('click', (e) => {
                createAIChat();
            });
        }
        
        if (newChatButton) {
            newChatButton.addEventListener('click', (e) => {
                createNewChat();
            });
        }

        // Search functionality - FIXED: Proper search input selection
        const searchInput = document.querySelector('#search input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // Mobile menu - FIXED: Use 'show' class as per CSS
        const menuButton = document.getElementById('menu');
        const mobileMenu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('overlay');
        
        if (menuButton && mobileMenu && overlay) {
            menuButton.addEventListener('click', (e) => {
                mobileMenu.classList.toggle('show');
                overlay.classList.toggle('show');
            });
            
            overlay.addEventListener('click', (e) => {
                mobileMenu.classList.remove('show');
                overlay.classList.remove('show');
            });
        }

        // Dark mode toggle - FIXED: Proper dark mode handling
        const darkModeButton = document.getElementById('dark-mode');
        if (darkModeButton) {
            darkModeButton.addEventListener('click', (e) => {
                toggleDarkMode();
            });
        }

        // Handle all other buttons with coming soon notification
        document.querySelectorAll('.msg-btn, .btn').forEach(btn => {
            if (!btn.hasAttribute('data-has-listener')) {
                btn.addEventListener('click', (e) => {
                    // Don't show notification for back buttons
                    if (!btn.classList.contains('msg-back-btn')) {
                        showNotification('Coming soon');
                    }
                });
                btn.setAttribute('data-has-listener', 'true');
            }
        });

        // Touch events for mobile - FIXED: Proper touch handling
        setupTouchEvents();
    }

    // Touch events for mobile responsiveness
    function setupTouchEvents() {
        document.querySelectorAll('.chat').forEach(chatItem => {
            chatItem.addEventListener('touchstart', function(e) {
                this.classList.add('touch-active');
            });
            
            chatItem.addEventListener('touchend', function(e) {
                this.classList.remove('touch-active');
                const chatId = this.getAttribute('data-chat');
                openChat(chatId);
            });
        });
    }

    // Camera Functionality - FIXED: Improved error handling
    async function toggleCamera() {
        if (appState.isCameraActive) {
            stopCamera();
        } else {
            await startCamera();
        }
    }

    async function startCamera() {
        try {
            // Check if browser supports camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showNotification('Camera not supported in this browser');
                return;
            }

            // Create camera modal
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

                // Add camera styles
                const cameraStyles = document.createElement('style');
                cameraStyles.textContent = `
                    #camera-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: black;
                        z-index: 10000;
                        display: none;
                    }
                    #camera-modal.active {
                        display: block;
                    }
                    .camera-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .camera-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        z-index: 10001;
                    }
                    .camera-header button {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 5px 10px;
                    }
                    .camera-preview {
                        flex: 1;
                        position: relative;
                        overflow: hidden;
                    }
                    #camera-video {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .camera-overlay {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 20px;
                        background: linear-gradient(transparent, rgba(0,0,0,0.7));
                    }
                    .camera-controls {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .camera-capture {
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        border: 3px solid white;
                        background: rgba(255,255,255,0.3);
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                `;
                document.head.appendChild(cameraStyles);

                // Camera event listeners
                cameraModal.querySelector('.camera-close').addEventListener('click', stopCamera);
                cameraModal.querySelector('.camera-switch').addEventListener('click', switchCamera);
                cameraModal.querySelector('.camera-capture').addEventListener('click', capturePhoto);
            }

            // Get camera stream with error handling
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

            // Show camera modal
            cameraModal.classList.add('active');

        } catch (error) {
            console.error('Error starting camera:', error);
            if (error.name === 'NotAllowedError') {
                showNotification('Camera access denied. Please allow camera permissions.');
            } else if (error.name === 'NotFoundError') {
                showNotification('No camera found on this device.');
            } else {
                showNotification('Camera error: ' + error.message);
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
            // Stop current stream
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
            showNotification('Error switching camera');
        }
    }

    function capturePhoto() {
        const video = document.querySelector('#camera-video');
        if (!video || !video.videoWidth) {
            showNotification('Camera not ready');
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
                showNotification('Photo captured!');
            } else {
                showNotification('Error capturing photo');
            }
        }, 'image/jpeg', 0.8);
    }

    function sendPhotoToChat(imageUrl) {
        if (!appState.currentChat) {
            showNotification('Open a chat to send photos');
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
        
        // SAVE MESSAGES TO LOCALSTORAGE - ADD THIS LINE
        saveMessagesToStorage();
        // Update chat last message
        const chat = appState.chats.find(c => c.id === appState.currentChat);
        if (chat) {
            chat.lastMessage = '📷 Photo';
            chat.timestamp = Date.now();
        }

        updateMessageDisplay(appState.currentChat);
        sortChats();
        updateChatList();
        
        // Close camera after sending
        setTimeout(stopCamera, 1000);
    }

    // Chat Management - FIXED: Use 'active' class as per CSS
        function openChat(chatId) {
        console.log('Opening chat:', chatId);
        
        // Hide all chats first
        document.querySelectorAll('.jibapp-message').forEach(chat => {
            chat.classList.remove('active');
        });

        // Show selected chat
        const selectedChat = document.getElementById(chatId);
        if (selectedChat) {
            selectedChat.classList.add('active');
            appState.currentChat = chatId;
            
            // Update chat list active state
            document.querySelectorAll('.chat').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-chat') === chatId) {
                    item.classList.add('active');
                }
            });

            // Mark as read
            markChatAsRead(chatId);
            scrollToBottom(selectedChat);
            
            // Clear notifications for this chat when opened
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
        
        // Remove active states
        document.querySelectorAll('.chat').forEach(item => {
            item.classList.remove('active');
        });
    }

    function markChatAsRead(chatId) {
        const chat = appState.chats.find(c => c.id === chatId);
        if (chat && chat.unread > 0) {
            chat.unread = 0;
            updateChatList();
        }
    }

    // Message Handling - FIXED: Improved message sending
    function sendMessage(chatIndex) {
        const chatId = appState.currentChat;
        if (!chatId) {
            showNotification('Please select a chat first');
            return;
        }

        const chatElement = document.getElementById(chatId);
        if (!chatElement) {
            showNotification('Chat not found');
            return;
        }

        const input = chatElement.querySelector('.msg-input');
        if (!input) {
            console.error('Message input not found for chat:', chatId);
            return;
        }

        const messageText = input.value.trim();

        if (!messageText) {
            // If no text, toggle recording (audio message)
            toggleAudioRecording(chatElement);
            return;
        }

        // Create new message
        const newMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'me',
            timestamp: Date.now(),
            read: false
        };
                // Add to messages
        if (!appState.messages[chatId]) {
            appState.messages[chatId] = [];
        }
        appState.messages[chatId].push(newMessage);
        
        // SAVE MESSAGES TO LOCALSTORAGE - ADD THIS LINE
        saveMessagesToStorage();
        // Update chat last message
        const chat = appState.chats.find(c => c.id === chatId);
        if (chat) {
            chat.lastMessage = messageText;
            chat.timestamp = Date.now();
            chat.unread = 0;
        }

        // Update UI
        updateMessageDisplay(chatId);
        input.value = '';
        // Reset send button to microphone
        const sendBtn = chatElement.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.classList.remove('typing');
        }
        
        sortChats();
        updateChatList();

        // Simulate reply
        simulateReply(chatId);
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
                // In a real app, you would upload this blob to a server
                console.log('Audio recorded:', audioBlob);
                showNotification('Audio message recorded');
                
                // Send audio message
                sendAudioMessage(audioBlob);
            };

            appState.mediaRecorder.start();
            appState.isRecording = true;

            // Show recording state
            const sendBtn = chatElement.querySelector('.send-btn');
            if (sendBtn) {
                sendBtn.style.background = '#ff4444';
            }
            showNotification('Recording audio...');

        } catch (err) {
            console.error('Error recording audio:', err);
            showNotification('Microphone access denied');
        }
    }

    function stopAudioRecording() {
        if (appState.mediaRecorder && appState.isRecording) {
            appState.mediaRecorder.stop();
            appState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            appState.isRecording = false;
            
            // Reset send button
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
        
        // SAVE MESSAGES TO LOCALSTORAGE - ADD THIS LINE
        saveMessagesToStorage();
        const chat = appState.chats.find(c => c.id === appState.currentChat);
        if (chat) {
            chat.lastMessage = '🎤 Audio message';
            chat.timestamp = Date.now();
        }

        updateMessageDisplay(appState.currentChat);
        sortChats();
        updateChatList();
    }

    function simulateReply(chatId) {
         if (chatId === 'ai-chat') {
            // AI chat specific replies
            setTimeout(() => {
                const aiReplies = [
                    "I understand your message! How can I assist you further?",
                    "That's interesting! Tell me more about that.",
                    "I'm here to help! What would you like to know?",
                    "Thanks for sharing! Is there anything specific you'd like to discuss?",
                    "I appreciate your message! How can I support you today?"
                ];
                
                const replyMessage = {
                    id: Date.now(),
                    text: aiReplies[Math.floor(Math.random() * aiReplies.length)],
                    sender: 'them',
                    timestamp: Date.now(),
                    read: false
                };

                if (!appState.messages[chatId]) {
                    appState.messages[chatId] = [];
                }
                appState.messages[chatId].push(replyMessage);

                updateMessageDisplay(chatId);
                sortChats();
                updateChatList();
                saveMessagesToStorage();
                // ADD NOTIFICATION FOR AI REPLY
                const chat = appState.chats.find(c => c.id === chatId);
                if (chat && notificationSystem.isInitialized) {
                    notificationSystem.addNotification(
                        chatId,
                        chat.name,
                        replyMessage.text,
                        chat.avatar
                    );
                }
            }, 1000);
            return;
        }
                // Regular chat replies
        setTimeout(() => {
            const replies = [
                "That's interesting!",
                "I see what you mean",
                "Let me think about that...",
                "Thanks for sharing!",
                "I agree with you",
                "That makes sense",
                "Tell me more about that",
                "I appreciate your perspective"
            ];

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
            saveMessagesToStorage();
            // Update chat
            const chat = appState.chats.find(c => c.id === chatId);
            if (chat) {
                chat.lastMessage = replyMessage.text;
                chat.timestamp = Date.now();
                chat.unread = (chat.unread || 0) + 1;
            }

            updateMessageDisplay(chatId);
            sortChats();
            updateChatList();
            
            // ADD NOTIFICATION FOR REGULAR CHAT REPLY
            if (chat && notificationSystem.isInitialized) {
                notificationSystem.addNotification(
                    chatId,
                    chat.name,
                    replyMessage.text,
                    chat.avatar
                );
            }
        }, 1000 + Math.random() * 2000);
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

        // Clear existing messages (except encryption notice)
        const encryptionMsg = msgContent.querySelector('.encryption-message');
        msgContent.innerHTML = '';
        if (encryptionMsg) {
            msgContent.appendChild(encryptionMsg);
        }

        // Add all messages
        messages.forEach(msg => {
            const msgElement = document.createElement('div');
            msgElement.className = `msg ${msg.sender === 'me' ? 'sent' : 'received'}`;
            
            if (msg.type === 'image') {
                msgElement.innerHTML = `
                    <div class="message-image">
                        <img src="${msg.imageUrl}" alt="Sent photo" style="max-width: 200px; border-radius: 8px;">
                    </div>
                    <span class="msg-time">
                        ${formatTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            } else if (msg.type === 'audio') {
                msgElement.innerHTML = `
                    <div class="message-audio">
                        <audio controls src="${msg.audioUrl}"></audio>
                    </div>
                    <span class="msg-time">
                        ${formatTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            } else {
                msgElement.innerHTML = `
                    <p>${escapeHtml(msg.text)}</p>
                    <span class="msg-time">
                        ${formatTime(msg.timestamp)}
                        ${msg.sender === 'me' ? '<img src="./assets/double_tick_32px.svg" alt="read">' : ''}
                    </span>
                `;
            }
            
            msgContent.appendChild(msgElement);
        });

        scrollToBottom(chatElement);
    }

    // AI Chat Functionality - FIXED: Improved AI chat creation
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

                // Add to chats
        appState.chats.unshift(aiChat);
        appState.messages[aiChatId] = [{
            id: 1,
            text: aiChat.lastMessage,
            sender: 'them',
            timestamp: Date.now(),
            read: false
        }];
        
        // SAVE MESSAGES TO LOCALSTORAGE - ADD THIS LINE
        saveMessagesToStorage();

        // Create chat HTML
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
        
        // Add to chat list
        const chatItemHTML = `
            <div class="chat" data-chat="${aiChatId}">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 24px;">🤖</div>
                <div class="chat-info">
                    <h4>JIBBKOL.AI</h4>
                    <p>Hello! I am JIBBKOL.AI. How can I help you today?</p>
                </div>
                <div class="chat-time">
                    <span>Just now</span>
                </div>
            </div>
        `;
        
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.insertAdjacentHTML('afterbegin', chatItemHTML);
        }
        
        // Reattach event listeners
        setupEventListeners();
        
        sortChats();
        updateChatList();
        openChat(aiChatId);
        showNotification('AI chat started with JIBBKOL.AI');
    }

    // New Chat Creation - FIXED: Improved new chat creation
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

                // Add to state
        appState.chats.unshift(newChat);
        appState.messages[newChatId] = [{
            id: 1,
            text: 'Chat started',
            sender: 'system',
            timestamp: Date.now(),
            read: true
        }];
        
        // SAVE MESSAGES TO LOCALSTORAGE - ADD THIS LINE
        saveMessagesToStorage();

        // Create chat HTML
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
        
        // Add to chat list
        const chatItemHTML = `
            <div class="chat" data-chat="${newChatId}">
                <img src="./assets/BARCELONA MESSI.jpeg" alt="profile">
                <div class="chat-info">
                    <h4>${escapeHtml(contactName.trim())}</h4>
                    <p>Chat started</p>
                </div>
                <div class="chat-time">
                    <span>Just now</span>
                </div>
            </div>
        `;
        
        const chatsList = document.getElementById('chats-list');
        if (chatsList) {
            chatsList.insertAdjacentHTML('afterbegin', chatItemHTML);
        }
        
        // Reattach event listeners
        setupEventListeners();
        
        sortChats();
        updateChatList();
        openChat(newChatId);
        showNotification(`New chat created with ${contactName.trim()}`);
    }

    // UI Updates - FIXED: Improved chat list updating
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
                if (time) time.textContent = formatTime(chat.timestamp);
                
                // Handle unread badge
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

    // Search Functionality - FIXED: Improved search
    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const chatItems = document.querySelectorAll('.chat');
        
        if (query === '') {
            // Show all chats when search is empty
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

    // Mobile Menu - FIXED: Use 'show' class
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

    // Dark Mode - FIXED: Improved dark mode handling
    function setupDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        const darkIcon = document.getElementById('dark-icon');
        const lightIcon = document.getElementById('light-icon');
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            if (darkIcon) darkIcon.style.display = 'block';
            if (lightIcon) lightIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-mode');
            if (darkIcon) darkIcon.style.display = 'none';
            if (lightIcon) lightIcon.style.display = 'block';
        }
    }

    function toggleDarkMode() {
        const isDarkMode = !document.body.classList.contains('dark-mode');
        const darkIcon = document.getElementById('dark-icon');
        const lightIcon = document.getElementById('light-icon');
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            if (darkIcon) darkIcon.style.display = 'block';
            if (lightIcon) lightIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-mode');
            if (darkIcon) darkIcon.style.display = 'none';
            if (lightIcon) lightIcon.style.display = 'block';
        }
        
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Utility Functions - FIXED: Improved utilities
    function scrollToBottom(chatElement) {
        setTimeout(() => {
            const msgBody = chatElement.querySelector('.msg-body');
            if (msgBody) {
                msgBody.scrollTop = msgBody.scrollHeight;
            }
        }, 100);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 604800000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString();
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message) {
        // Remove existing notifications
        document.querySelectorAll('.custom-notification').forEach(notification => {
            notification.remove();
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        
        // Add styles if not exists
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
                .touch-active {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    transition: all 0.1s ease;
                }
                .message-image, .message-audio {
                    margin: 5px 0;
                }
                .message-image img {
                    max-width: 200px;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .message-audio audio {
                    max-width: 200px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after 3 seconds
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
        
        // Show typing indicator
        const chatElement = document.getElementById(appState.currentChat);
        if (chatElement) {
            updateTypingIndicator(chatElement, input.value.length > 0);
            
            // Clear previous timeout
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
                }
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }

    function setupInitialState() {
        // Hide all chat messages initially (they start with transform: translateX(100%))
        // No need to manually hide them as CSS already does this
        
        // Set first chat as active in list
        const firstChat = document.querySelector('.chat');
        if (firstChat) {
            firstChat.classList.add('active');
        }
        
        // Ensure all chats are responsive
        document.querySelectorAll('.chat').forEach(item => {
            item.style.cursor = 'pointer';
        });

        // Initialize chat list with proper data
        updateChatList();
    }

    // Initialize the app
    init();

});



const sidebar = document.getElementById('desktop-sidebar');
const toggle = document.getElementById('sidebar-toggle');
const menupcbtn = document.getElementById("menu2");
const pcmenu =document.getElementById("nav");

toggle.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
    overlay.classList.add("show")
});

overlay.addEventListener("click" ,()=>{
    sidebar.classList.remove('expanded')
});

menupcbtn.addEventListener('click', () => {
    pcmenu.classList.toggle('show');
    overlay.classList.add("show")
});
overlay.addEventListener("click" ,()=>{
    pcmenu.classList.remove('show')
});