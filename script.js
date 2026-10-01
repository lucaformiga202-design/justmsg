// --- IMPORTAÇÕES DO FIREBASE (CDN ESM) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// --- SERVIDOR 1: AUTENTICAÇÃO (turu-auth-53a38) ---
const authFirebaseConfig = {
  apiKey: "AIzaSyByuZxF0KhryOS1kSb4vh8W8bPwGjssIYg",
  authDomain: "turu-auth-53a38.firebaseapp.com",
  projectId: "turu-auth-53a38",
  storageBucket: "turu-auth-53a38.firebasestorage.app",
  messagingSenderId: "782168593551",
  appId: "1:782168593551:web:6c4e8295b391fa6c3b4cfa",
  measurementId: "G-NLR0E3BR2V"
};

// --- SERVIDOR 2: BANCO DE MENSAGENS (justmsg-e0a34) ---
const msgFirebaseConfig = {
  apiKey: "AIzaSyCTLuYaX-oiL0OH76kIrvk80wHJ3mjiNEY",
  authDomain: "justmsg-e0a34.firebaseapp.com",
  projectId: "justmsg-e0a34",
  storageBucket: "justmsg-e0a34.firebasestorage.app",
  messagingSenderId: "891271826589",
  appId: "1:891271826589:web:b8e247c3f34e7b7b6f5874",
  measurementId: "G-XS2GKSCSPZ"
};

// Inicialização das duas instâncias separadas
const authApp = initializeApp(authFirebaseConfig, "AUTH_APP");
const msgApp = initializeApp(msgFirebaseConfig, "MSG_APP");

// Instâncias dos Serviços
const auth = getAuth(authApp);
const db = getFirestore(msgApp);
const googleProvider = new GoogleAuthProvider();

// Variáveis globais de controle
let currentUser = null;
let unsubscribeMessages = null;

// --- ELEMENTOS DO DOM ---
const loginPage = document.getElementById("login");
const registerPage = document.getElementById("signup");
const chatContainer = document.getElementById("chat-container");

const goToSignUp = document.getElementById("gotosignup");
const goToLogin = document.getElementById("gotologin");

const emailLoginInput = document.getElementById("email-login");
const passwordLoginInput = document.getElementById("password-login");
const btnLogin = document.getElementById("btn-login");

const emailRegInput = document.getElementById("email-reg");
const passwordRegInput = document.getElementById("password-reg");
const btnSignup = document.getElementById("btn-signup");

const googleButtons = document.querySelectorAll(".btn-google");

const userDisplay = document.getElementById("user-display");
const btnLogout = document.getElementById("btn-logout");
const messagesContainer = document.getElementById("messages-container");
const messageInput = document.getElementById("message-input");
const btnSend = document.getElementById("btn-send");

// --- TROCA DE TELAS ---
goToSignUp.onclick = function (event) {
  event.preventDefault();
  loginPage.style.display = "none";
  registerPage.style.display = "flex";
};

goToLogin.onclick = function (event) {
  event.preventDefault();
  loginPage.style.display = "flex";
  registerPage.style.display = "none";
};

function clearInputs() {
  emailLoginInput.value = "";
  passwordLoginInput.value = "";
  emailRegInput.value = "";
  passwordRegInput.value = "";
  messageInput.value = "";
}

// --- MONITOR DE LOGIN DO SERVIDOR 1 (AUTH) ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    userDisplay.textContent = user.displayName || user.email;
    
    // Oculta telas de autenticação e exibe o Chat
    loginPage.style.display = "none";
    registerPage.style.display = "none";
    chatContainer.style.display = "flex";

    // Conecta e carrega as mensagens do SERVIDOR 2 (FIRESTORE)
    loadMessages();
  } else {
    currentUser = null;
    chatContainer.style.display = "none";
    loginPage.style.display = "flex";
    
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }
  }
});

// --- AÇÕES DO SERVIDOR 1 (AUTENTICAÇÃO) ---
btnSignup.addEventListener("click", () => {
  const email = emailRegInput.value;
  const password = passwordRegInput.value;

  if (!email || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => clearInputs())
    .catch((error) => alert("Erro ao criar conta: " + error.message));
});

btnLogin.addEventListener("click", () => {
  const email = emailLoginInput.value;
  const password = passwordLoginInput.value;

  if (!email || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => clearInputs())
    .catch((error) => alert("Erro ao entrar: " + error.message));
});

googleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    signInWithPopup(auth, googleProvider)
      .then(() => clearInputs())
      .catch((error) => alert("Erro com Google: " + error.message));
  });
});

btnLogout.addEventListener("click", () => {
  signOut(auth);
});

// --- AÇÕES DO SERVIDOR 2 (ENVIAR E LER MENSAGENS NO FIRESTORE) ---
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentUser) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: currentUser.displayName || currentUser.email,
      uid: currentUser.uid,
      timestamp: serverTimestamp()
    });
    messageInput.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

btnSend.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const msgElement = document.createElement("div");
      
      const isMyMsg = currentUser && msg.uid === currentUser.uid;
      msgElement.className = `msg-item ${isMyMsg ? "my-msg" : ""}`;

      msgElement.innerHTML = `
        <span class="msg-sender">${msg.sender || "Anônimo"}</span>
        <div class="msg-text">${msg.text}</div>
      `;
      
      messagesContainer.appendChild(msgElement);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}
