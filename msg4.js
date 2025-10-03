/* msg.js — Full Telegram-like features (typing, ticks, unread, reorder, voice, menu, reactions, search, pin, online/last-seen)
   Designed to work with your existing HTML structure:
   - .chat (data-chat="chatX")
   - .jibapp-message (id="chatX")
   - .msg-input (per chat)
   - .send-btn (per chat)
   - .msg-content (per chat)
   - .msg-back-btn (per chat)
   - .chat-info p, .chat-time span:first-child, .unread-count
   - #chat-inner container for reordering
*/

document.addEventListener("DOMContentLoaded", () => {
  const chats = document.querySelectorAll(".chat");
  const chatWindows = document.querySelectorAll(".jibapp-message");
  const backButtons = document.querySelectorAll(".msg-back-btn");
  const sendButtons = document.querySelectorAll(".send-btn");
  const inputs = document.querySelectorAll(".msg-input");
  const chatInner = document.getElementById("chat-inner");

  let currentChat = null;
  let longPressTimer = null;
  let longPressMsgTimer = null;
  let chatData = loadChatData();

  function loadChatData() {
    const saved = localStorage.getItem("jibbappChatData");
    if (saved) return JSON.parse(saved);
    // Basic scaffolding for visible chats (if not present)
    const initial = { chats: {}, currentChat: null };
    // Pre-create chat entries for any .chat elements found in DOM (keeps names in sync)
    document.querySelectorAll(".chat").forEach(c => {
      const id = c.getAttribute("data-chat");
      if (!initial.chats[id]) {
        initial.chats[id] = {
          id,
          name: (c.querySelector("h4") && c.querySelector("h4").textContent) || id,
          profilePic: "",
          messages: [],
          lastMessage: "",
          timestamp: "",
          unreadCount: 0,
          pinned: false,
          isOnline: false,
          lastSeen: ""
        };
      }
    });
    localStorage.setItem("jibbappChatData", JSON.stringify(initial));
    return initial;
  }

  function saveChatData() {
    localStorage.setItem("jibbappChatData", JSON.stringify(chatData));
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- Rendering & utility ---------- */

  function renderMessages(chatId) {
    const win = document.getElementById(chatId);
    if (!win) return;
    const content = win.querySelector(".msg-content");
    if (!content) return;

    // Keep encryption message if present
    const enc = content.querySelector(".encryption-message");
    content.innerHTML = "";
    if (enc) content.appendChild(enc);

    const msgs = chatData.chats[chatId]?.messages || [];
    msgs.forEach(m => {
      const mEl = buildMessageElement(m);
      content.appendChild(mEl);
    });
    content.scrollTop = content.scrollHeight;
  }

  function buildMessageElement(msgObj) {
    const div = document.createElement("div");
    div.className = "msg " + (msgObj.type || "received");
    // content
    const p = document.createElement("p");
    p.textContent = msgObj.text || (msgObj.type === "voice" ? `[voice ${msgObj.duration || 0}s]` : "");
    div.appendChild(p);

    // attachments / voice styling
    if (msgObj.type === "voice") {
      div.dataset.voice = "true";
      // optional: add play button (not functional, just UI)
      const play = document.createElement("small");
      play.style.display = "block";
      play.style.fontSize = "0.85rem";
      play.style.marginTop = "6px";
      play.textContent = `🎤 ${msgObj.duration || 1}s`;
      div.appendChild(play);
    }

    // reactions display
    if (msgObj.reactions && Object.keys(msgObj.reactions).length) {
      const rWrap = document.createElement("div");
      rWrap.className = "msg-reactions";
      rWrap.style.marginTop = "6px";
      rWrap.style.display = "flex";
      rWrap.style.gap = "6px";
      Object.entries(msgObj.reactions).forEach(([emoji, count]) => {
        const chip = document.createElement("span");
        chip.textContent = `${emoji} ${count}`;
        chip.style.fontSize = "0.8rem";
        chip.style.padding = "2px 6px";
        chip.style.borderRadius = "12px";
        chip.style.background = "rgba(255,255,255,0.06)";
        rWrap.appendChild(chip);
      });
      div.appendChild(rWrap);
    }

    // time + tick
    const timeSpan = document.createElement("span");
    timeSpan.className = "msg-time";
    timeSpan.style.fontSize = "0.8rem";
    timeSpan.style.marginLeft = "10px";
    timeSpan.textContent = msgObj.time || formatTime();
    if (msgObj.type === "sent") {
      const tick = document.createElement("span");
      tick.className = "msg-tick";
      tick.style.marginLeft = "8px";
      tick.textContent = msgObj.status === "delivered" ? "✓✓" : "✓";
      timeSpan.appendChild(tick);
    }
    div.appendChild(timeSpan);

    // attach dataset id for editing/deleting
    if (msgObj.id) div.dataset.msgId = msgObj.id;

    // enable message interactions (long-press for menu, click for reactions)
    attachMessageInteractions(div);

    return div;
  }

  function attachMessageInteractions(messageElement) {
    // Prevent attaching multiple listeners
    if (messageElement.__listenersAttached) return;
    messageElement.__listenersAttached = true;

    // Tap/click to react
    messageElement.addEventListener("click", (e) => {
      // show reactions picker
      showReactionsPicker(e.currentTarget);
    });

    // Right-click or long-press for message menu (forward/edit/delete)
    messageElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showMessageMenu(e.pageX, e.pageY, e.currentTarget);
    });

    // For mobile long-press
    let mpTimer = null;
    messageElement.addEventListener("touchstart", (e) => {
      mpTimer = setTimeout(() => {
        showMessageMenu(e.touches[0].pageX, e.touches[0].pageY, e.currentTarget);
      }, 600);
    });
    messageElement.addEventListener("touchend", () => {
      if (mpTimer) clearTimeout(mpTimer);
    });
  }

  /* ---------- Chat open/close & back ---------- */

  chats.forEach(chat => {
    chat.addEventListener("click", () => {
      const id = chat.getAttribute("data-chat");
      openChat(id);
    });

    // context menu on chat (pin, info, delete) via right-click or long press
    chat.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showChatMenu(e.pageX, e.pageY, chat);
    });
    // touch long-press
    let tTimer = null;
    chat.addEventListener("touchstart", (e) => {
      tTimer = setTimeout(() => showChatMenu(e.touches[0].pageX, e.touches[0].pageY, chat), 700);
    });
    chat.addEventListener("touchend", () => { if (tTimer) clearTimeout(tTimer); });
  });

  function openChat(chatId) {
    currentChat = chatId;
    chatData.currentChat = chatId;
    // close all windows
    chatWindows.forEach(w => w.classList.remove("active"));
    const win = document.getElementById(chatId);
    if (win) win.classList.add("active");

    // mark unread zero
    const chatEl = document.querySelector(`.chat[data-chat="${chatId}"]`);
    const unreadEl = chatEl && chatEl.querySelector(".unread-count");
    if (unreadEl) { unreadEl.style.display = "none"; chatData.chats[chatId].unreadCount = 0; }

    // render messages
    renderMessages(chatId);
    saveChatData();
  }

  backButtons.forEach(b => {
    b.addEventListener("click", () => {
      const w = b.closest(".jibapp-message");
      if (w) w.classList.remove("active");
      currentChat = null;
      chatData.currentChat = null;
      saveChatData();
    });
  });

  /* ---------- Sending, Enter key, ticks, chat preview update ---------- */

  function sendTextMessage(chatWindow, text) {
    if (!text || !text.trim()) return;
    const chatId = chatWindow.id;
    const now = new Date();
    const time = formatTime(now);
    const msgId = "m_" + Date.now() + Math.floor(Math.random()*1000);

    // message object structure
    const msgObj = { id: msgId, type: "sent", text, time, status: "sent", reactions: {} };

    chatData.chats[chatId] = chatData.chats[chatId] || { messages: [] };
    chatData.chats[chatId].messages.push(msgObj);
    chatData.chats[chatId].lastMessage = text;
    chatData.chats[chatId].timestamp = time;
    saveChatData();

    // append to DOM
    const content = chatWindow.querySelector(".msg-content");
    const mEl = buildMessageElement(msgObj);
    content.appendChild(mEl);
    content.scrollTop = content.scrollHeight;

    // update preview + reorder
    updateChatPreview(chatId, text, time);
    reorderChat(chatId);

    // mark delivered after short delay (simulate)
    setTimeout(() => {
      markMessageDelivered(chatId, msgId, mEl);
    }, 400 + Math.random()*400);
    return msgObj;
  }

  function markMessageDelivered(chatId, msgId, msgElement) {
    // update data
    const msgs = chatData.chats[chatId]?.messages || [];
    const m = msgs.find(x => x.id === msgId);
    if (m) { m.status = "delivered"; saveChatData(); }
    // update DOM tick
    const tickSpan = msgElement.querySelector(".msg-tick");
    if (tickSpan) tickSpan.textContent = "✓✓";
  }

  sendButtons.forEach(btn => {
    // support click and long-press for voice (long-press handled below)
    btn.addEventListener("click", (e) => {
      // if mic visible? we will read input (supports multiple inputs)
      const chatWindow = btn.closest(".jibapp-message");
      if (!chatWindow) return;
      const input = chatWindow.querySelector(".msg-input");
      if (input && input.value.trim() !== "") {
        sendTextMessage(chatWindow, input.value.trim());
        input.value = "";
      } else {
        // empty input — for now we'll alert user about voice long-press
        alert("Tip: Hold the button to record a voice message (simulated).");
      }
    });

    // long-press detection for voice message (mouse + touch)
    let timer = null, startTime = 0;
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startTime = Date.now();
      timer = setTimeout(() => {
        // start "recording" indicator
        btn.classList.add("recording");
        btn.textContent = "⏺"; // visual cue
        // store start timestamp on element
        btn.dataset.voiceStart = Date.now();
      }, 300); // start recording after 300ms hold
    });
    window.addEventListener("mouseup", (e) => {
      if (timer) clearTimeout(timer);
      // if recording was ongoing
      if (btn.classList && btn.classList.contains && btn.classList.contains("recording")) {
        const start = Number(btn.dataset.voiceStart || Date.now());
        const duration = Math.max(1, Math.round((Date.now() - start)/1000));
        btn.classList.remove("recording");
        btn.innerHTML = `<img src="./assets/microphone_24px.svg" class="mic" />`;
        // send simulated voice message
        const chatWindow = btn.closest(".jibapp-message");
        if (chatWindow) sendVoiceMessage(chatWindow, duration);
      }
    });

    // touch support
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startTime = Date.now();
      timer = setTimeout(() => {
        btn.classList.add("recording");
        btn.textContent = "⏺";
        btn.dataset.voiceStart = Date.now();
      }, 300);
    });
    btn.addEventListener("touchend", (e) => {
      if (timer) clearTimeout(timer);
      if (btn.classList && btn.classList.contains && btn.classList.contains("recording")) {
        const start = Number(btn.dataset.voiceStart || Date.now());
        const duration = Math.max(1, Math.round((Date.now() - start)/1000));
        btn.classList.remove("recording");
        btn.innerHTML = `<img src="./assets/microphone_24px.svg" class="mic" />`;
        const chatWindow = btn.closest(".jibapp-message");
        if (chatWindow) sendVoiceMessage(chatWindow, duration);
      }
    });
  });

  // Enter + Shift+Enter support for all inputs
  inputs.forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const chatWindow = inp.closest(".jibapp-message");
        if (chatWindow) {
          sendTextMessage(chatWindow, inp.value.trim());
          inp.value = "";
        }
      }
    });
  });

  function sendVoiceMessage(chatWindow, duration) {
    const chatId = chatWindow.id;
    const now = new Date();
    const time = formatTime(now);
    const msgId = "mv_" + Date.now();
    const msgObj = { id: msgId, type: "voice", text: "[voice message]", duration, time, reactions: {} };

    chatData.chats[chatId] = chatData.chats[chatId] || { messages: [] };
    chatData.chats[chatId].messages.push(msgObj);
    chatData.chats[chatId].lastMessage = `[voice ${duration}s]`;
    chatData.chats[chatId].timestamp = time;
    saveChatData();

    const content = chatWindow.querySelector(".msg-content");
    const mEl = buildMessageElement(msgObj);
    content.appendChild(mEl);
    content.scrollTop = content.scrollHeight;

    updateChatPreview(chatId, chatData.chats[chatId].lastMessage, time);
    reorderChat(chatId);

    // simulate delivered status for voice after short time
    setTimeout(() => {
      // voice delivered — we won't show ticks for voice (or we can)
      // simple simulation: nothing more required
    }, 400);
  }

  /* ---------- Typing, auto-replies, ticks, unread and reorder ---------- */

  function showTypingThenReply(chatWindow, chatId, originalText) {
    const content = chatWindow.querySelector(".msg-content");
    if (!content) return;

    // typing bubble
    const typingEl = document.createElement("div");
    typingEl.className = "msg received typing";
    typingEl.innerHTML = `<p>typing...</p>`;
    content.appendChild(typingEl);
    content.scrollTop = content.scrollHeight;

    setTimeout(() => {
      typingEl.remove();
      autoReply(chatWindow, chatId, originalText);
    }, 800 + Math.random()*800); // slight random delay
  }

  function autoReply(chatWindow, chatId, userText) {
    const responses = [
      "👍", "😂", "Ok!", "Sure!", "Interesting...", "Cool 😎", "Tell me more...", "Nice!"
    ];
    let reply = responses[Math.floor(Math.random()*responses.length)];
    if (/hello|hi|hey/i.test(userText)) reply = "Hey! 👋";
    if (/how are you/i.test(userText)) reply = "Doing well, you?";

    const time = formatTime();
    const msgId = "m_auto_" + Date.now();

    const msgObj = { id: msgId, type: "received", text: reply, time, reactions: {} };
    chatData.chats[chatId].messages.push(msgObj);
    chatData.chats[chatId].lastMessage = reply;
    chatData.chats[chatId].timestamp = time;

    // Append to DOM if chat is open
    const content = chatWindow.querySelector(".msg-content");
    const mEl = buildMessageElement(msgObj);
    content.appendChild(mEl);

    // If chat closed, increment unread
    if (currentChat !== chatId) {
      chatData.chats[chatId].unreadCount = (chatData.chats[chatId].unreadCount || 0) + 1;
      const unreadEl = document.querySelector(`.chat[data-chat="${chatId}"] .unread-count`);
      if (unreadEl) {
        unreadEl.textContent = chatData.chats[chatId].unreadCount;
        unreadEl.style.display = "inline-block";
      }
    }

    updateChatPreview(chatId, reply, time);
    reorderChat(chatId);
    content.scrollTop = content.scrollHeight;
    saveChatData();
  }

  /* ---------- Chat preview update & reorder & pin ---------- */

  function updateChatPreview(chatId, text, time) {
    const chatEl = document.querySelector(`.chat[data-chat="${chatId}"]`);
    if (!chatEl) return;
    const preview = chatEl.querySelector(".chat-info p");
    const timeEl = chatEl.querySelector(".chat-time span:first-child");
    if (preview) preview.textContent = text || "";
    if (timeEl) timeEl.textContent = time || "";
  }

  function reorderChat(chatId) {
    if (!chatInner) return;
    const chatEl = document.querySelector(`.chat[data-chat="${chatId}"]`);
    if (!chatEl) return;

    // If pinned, keep it among pinned area (pins appear at top)
    if (chatData.chats[chatId] && chatData.chats[chatId].pinned) {
      // bring to top of pinned (prepend among pinned)
      // strategy: find first non-pinned and insert before it
      const all = Array.from(chatInner.children);
      const firstNonPinned = all.find(c => {
        const id = c.getAttribute && c.getAttribute("data-chat");
        return !id || !chatData.chats[id] || !chatData.chats[id].pinned;
      });
      if (firstNonPinned) chatInner.insertBefore(chatEl, firstNonPinned);
      else chatInner.prepend(chatEl);
      return;
    }

    // Otherwise prepend to top, but keep pinned above
    // find last pinned element
    const all = Array.from(chatInner.children);
    let insertBeforeNode = null;
    for (let c of all) {
      const id = c.getAttribute && c.getAttribute("data-chat");
      if (!id) continue;
      if (!chatData.chats[id] || !chatData.chats[id].pinned) { insertBeforeNode = c; break; }
    }
    if (insertBeforeNode) chatInner.insertBefore(chatEl, insertBeforeNode);
    else chatInner.prepend(chatEl);
  }

  /* ---------- Message menu (forward / edit / delete) ---------- */

  function showMessageMenu(pageX, pageY, messageElement) {
    // build small floating menu
    const menu = document.createElement("div");
    menu.className = "msg-context-menu";
    menu.style.position = "absolute";
    menu.style.left = pageX + "px";
    menu.style.top = pageY + "px";
    menu.style.background = "#222";
    menu.style.color = "#fff";
    menu.style.borderRadius = "8px";
    menu.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5)";
    menu.style.zIndex = 9999;
    menu.style.padding = "6px";
    menu.style.display = "flex";
    menu.style.flexDirection = "column";
    menu.style.gap = "6px";
    menu.style.fontSize = "14px";

    const forward = document.createElement("button");
    forward.textContent = "Forward";
    forward.style.background = "transparent";
    forward.style.color = "#fff";
    forward.style.border = "none";
    forward.style.cursor = "pointer";
    forward.onclick = () => { alert("Forward coming soon!"); menu.remove(); };

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.style.background = "transparent";
    edit.style.color = "#fff";
    edit.style.border = "none";
    edit.style.cursor = "pointer";
    edit.onclick = () => { editMessageInline(messageElement); menu.remove(); };

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.style.background = "transparent";
    del.style.color = "#fff";
    del.style.border = "none";
    del.style.cursor = "pointer";
    del.onclick = () => { deleteMessage(messageElement); menu.remove(); };

    menu.appendChild(forward);
    menu.appendChild(edit);
    menu.appendChild(del);

    document.body.appendChild(menu);

    // remove on click elsewhere
    const rm = (e) => {
      if (!menu.contains(e.target)) { menu.remove(); window.removeEventListener("click", rm); }
    };
    window.addEventListener("click", rm);
  }

  function deleteMessage(messageElement) {
    const chatWindow = messageElement.closest(".jibapp-message");
    if (!chatWindow) return;
    const chatId = chatWindow.id;
    const msgId = messageElement.dataset.msgId;
    if (!msgId) {
      // fallback: remove from DOM only
      messageElement.remove();
      return;
    }
    const arr = chatData.chats[chatId]?.messages || [];
    const idx = arr.findIndex(m => m.id === msgId);
    if (idx >= 0) {
      arr.splice(idx, 1);
      saveChatData();
      renderMessages(chatId);
    }
  }

  function editMessageInline(messageElement) {
    const chatWindow = messageElement.closest(".jibapp-message");
    if (!chatWindow) return;
    const chatId = chatWindow.id;
    const msgId = messageElement.dataset.msgId;
    if (!msgId) { alert("This message cannot be edited"); return; }

    // find message data
    const arr = chatData.chats[chatId]?.messages || [];
    const m = arr.find(x => x.id === msgId);
    if (!m) return;

    // replace message with input
    const p = messageElement.querySelector("p");
    const oldText = p ? p.textContent : "";
    const input = document.createElement("input");
    input.type = "text";
    input.value = oldText;
    input.style.width = "80%";
    messageElement.innerHTML = "";
    messageElement.appendChild(input);
    input.focus();

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const newText = input.value.trim();
        if (!newText) { messageElement.remove(); return; }
        m.text = newText;
        m.edited = true;
        saveChatData();
        renderMessages(chatId);
      } else if (e.key === "Escape") {
        renderMessages(chatId);
      }
    });
  }

  /* ---------- Reactions UI & storage ---------- */

  function showReactionsPicker(messageEl) {
    // tiny reactions bar near the message
    const rect = messageEl.getBoundingClientRect();
    const picker = document.createElement("div");
    picker.style.position = "absolute";
    picker.style.left = (rect.left + window.scrollX) + "px";
    picker.style.top = (rect.top + window.scrollY - 40) + "px";
    picker.style.background = "#222";
    picker.style.padding = "6px";
    picker.style.borderRadius = "20px";
    picker.style.display = "flex";
    picker.style.gap = "6px";
    picker.style.zIndex = 9999;

    const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
    emojis.forEach(em => {
      const b = document.createElement("button");
      b.textContent = em;
      b.style.border = "none";
      b.style.background = "transparent";
      b.style.cursor = "pointer";
      b.style.fontSize = "18px";
      b.onclick = () => {
        applyReactionToMessage(messageEl, em);
        picker.remove();
      };
      picker.appendChild(b);
    });

    document.body.appendChild(picker);
    const rm = (e) => {
      if (!picker.contains(e.target)) { picker.remove(); window.removeEventListener("click", rm); }
    };
    window.addEventListener("click", rm);
  }

  function applyReactionToMessage(messageEl, emoji) {
    const chatWindow = messageEl.closest(".jibapp-message");
    if (!chatWindow) return;
    const chatId = chatWindow.id;
    const msgId = messageEl.dataset.msgId;
    if (!msgId) { alert("Cannot react to this message"); return; }

    const arr = chatData.chats[chatId].messages || [];
    const m = arr.find(x => x.id === msgId);
    if (!m) return;
    m.reactions = m.reactions || {};
    m.reactions[emoji] = (m.reactions[emoji] || 0) + 1;
    saveChatData();
    renderMessages(chatId);
  }

  /* ---------- Chat menu (pin, info, search inside chat) ---------- */

  function showChatMenu(pageX, pageY, chatEl) {
    const chatId = chatEl.getAttribute("data-chat");
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.left = pageX + "px";
    menu.style.top = pageY + "px";
    menu.style.zIndex = 9999;
    menu.style.background = "#222";
    menu.style.color = "#fff";
    menu.style.borderRadius = "8px";
    menu.style.padding = "6px";
    menu.style.display = "flex";
    menu.style.flexDirection = "column";
    menu.style.gap = "6px";

    const pinBtn = document.createElement("button");
    pinBtn.textContent = chatData.chats[chatId] && chatData.chats[chatId].pinned ? "Unpin" : "Pin";
    pinBtn.style.background = "transparent";
    pinBtn.style.border = "none";
    pinBtn.style.color = "#fff";
    pinBtn.style.cursor = "pointer";
    pinBtn.onclick = () => {
      chatData.chats[chatId].pinned = !chatData.chats[chatId].pinned;
      saveChatData();
      reorderAllChatsOnLoad();
      alert(chatData.chats[chatId].pinned ? "Pinned" : "Unpinned");
      menu.remove();
    };

    const infoBtn = document.createElement("button");
    infoBtn.textContent = "Info";
    infoBtn.style.background = "transparent";
    infoBtn.style.border = "none";
    infoBtn.style.color = "#fff";
    infoBtn.style.cursor = "pointer";
    infoBtn.onclick = () => { alert("Chat info coming soon!"); menu.remove(); };

    const searchBtn = document.createElement("button");
    searchBtn.textContent = "Search inside chat";
    searchBtn.style.background = "transparent";
    searchBtn.style.border = "none";
    searchBtn.style.color = "#fff";
    searchBtn.style.cursor = "pointer";
    searchBtn.onclick = () => { menu.remove(); promptSearchInside(chatId); };

    menu.appendChild(pinBtn);
    menu.appendChild(searchBtn);
    menu.appendChild(infoBtn);
    document.body.appendChild(menu);

    const rm = (e) => { if (!menu.contains(e.target)) { menu.remove(); window.removeEventListener("click", rm); } };
    window.addEventListener("click", rm);
  }

  function reorderAllChatsOnLoad() {
    // reorder pinned first (in order pinned), then rest by existing DOM order
    if (!chatInner) return;
    // get pinned list and others
    const nodes = Array.from(chatInner.children).filter(n => n.getAttribute);
    const pinned = nodes.filter(n => {
      const id = n.getAttribute("data-chat"); return id && chatData.chats[id] && chatData.chats[id].pinned;
    });
    const others = nodes.filter(n => {
      const id = n.getAttribute("data-chat"); return !id || !chatData.chats[id] || !chatData.chats[id].pinned;
    });
    // re-append
    pinned.forEach(n => chatInner.appendChild(n));
    others.forEach(n => chatInner.appendChild(n));
  }

  /* ---------- Search inside chat ---------- */

  function promptSearchInside(chatId) {
    const term = prompt("Search inside chat: (case-insensitive)");
    if (!term) return;
    highlightInChat(chatId, term);
  }

  function highlightInChat(chatId, term) {
    const win = document.getElementById(chatId);
    if (!win) return;
    const content = win.querySelector(".msg-content");
    if (!content) return;
    // simple approach: re-render messages, then wrap matches with <mark>
    renderMessages(chatId);
    const marks = content.querySelectorAll("p");
    const re = new RegExp(escapeRegExp(term), "ig");
    marks.forEach(p => {
      p.innerHTML = p.textContent.replace(re, (m) => `<mark class="search-mark">${m}</mark>`);
    });
  }

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* ---------- Utility: message build on load ---------- */

  function initialRenderAll() {
    // ensure chatData has entries for DOM chats (keeps names)
    document.querySelectorAll(".chat").forEach(c => {
      const id = c.getAttribute("data-chat");
      if (!chatData.chats[id]) {
        chatData.chats[id] = { id, name: (c.querySelector("h4")?.textContent)||id, messages: [], lastMessage: "", timestamp: "", unreadCount:0, pinned:false, isOnline:false, lastSeen:"" };
      }
    });

    // set previews & unread
    Object.keys(chatData.chats).forEach(cid => {
      const info = chatData.chats[cid];
      updateChatPreview(cid, info.lastMessage || "", info.timestamp || "");
      const unreadEl = document.querySelector(`.chat[data-chat="${cid}"] .unread-count`);
      if (unreadEl && info.unreadCount) { unreadEl.textContent = info.unreadCount; unreadEl.style.display = "inline-block"; }
    });

    // reorder pinned if any
    reorderAllChatsOnLoad();
  }

  /* ---------- Editing online/last seen in header ---------- */
  // Clicking the status span toggles online/last seen
  document.querySelectorAll(".jibapp-message .msg-name span").forEach(span => {
    span.addEventListener("click", (e) => {
      const header = span.closest(".jibapp-message");
      if (!header) return;
      const chatId = header.id;
      if (!chatId) return;
      const info = chatData.chats[chatId] = chatData.chats[chatId] || {};
      info.isOnline = !info.isOnline;
      info.lastSeen = info.isOnline ? "online" : `last seen ${Math.floor(Math.random()*10)+1} hours ago`;
      span.textContent = info.isOnline ? "online" : info.lastSeen;
      saveChatData();
      alert(`Status toggled: ${span.textContent}`);
    });
  });

  /* ---------- Start-up ---------- */

  initialRenderAll();

  // restore last active chat
  if (chatData.currentChat && document.getElementById(chatData.currentChat)) {
    openChat(chatData.currentChat);
  }

  // auto-save periodically (just in case)
  setInterval(saveChatData, 5000);

  /* ---------- Helper: message ID mapping for interaction ---------- */
  // Attach interactions to already-existing message DOM nodes (from static HTML)
  document.querySelectorAll(".msg").forEach(m => {
    attachMessageInteractions(m);
  });

  // Hook into send action to trigger typing & autobots:
  // We wrap the sendTextMessage function to also show typing & auto reply
  // Achieved by modifying sendTextMessage calls: when a user sends, trigger typing then reply.
  // We adjusted sendTextMessage above to only create message; now we ensure an auto-reply starts.
  // To do that, we patch the sendTextMessage usage where used (we already call markDelivered & showTypingThenReply in sendTextMessage earlier).
  // But ensure that when text message is sent manually (via click/enter) we call showTypingThenReply
  // For that, we'll intercept DOM operations in sendButtons/inputs where we call sendTextMessage:
  // (we already implemented sendTextMessage -> markDelivered & not calling showTypingThenReply directly).
  // So to make auto reply happen, we detect new sent messages in chatData and schedule typing+reply:
  // We'll watch saveChatData via setTimeout (simple pub-sub)
  let lastSavedHash = JSON.stringify(chatData);
  setInterval(() => {
    const currentHash = JSON.stringify(chatData);
    if (currentHash !== lastSavedHash) {
      // Find newly added sent message in current chat and trigger reply
      if (currentChat) {
        const arr = chatData.chats[currentChat]?.messages || [];
        if (arr.length) {
          const last = arr[arr.length - 1];
          if (last.type === "sent" && last._autoReplyScheduled !== true) {
            last._autoReplyScheduled = true; // mark to avoid duplicates
            const win = document.getElementById(currentChat);
            setTimeout(() => { showTypingThenReply(win, currentChat, last.text); }, 600 + Math.random()*400);
            lastSavedHash = JSON.stringify(chatData);
            saveChatData();
          }
        }
      }
      lastSavedHash = currentHash;
    }
  }, 600);

  /* ---------- End of script ---------- */
});
