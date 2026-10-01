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
  doc,
  setDoc,
  getDoc,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const CLOUD_NAME = "diqswgi4";
const UPLOAD_PRESET = "ml_default";

// SERVIDOR 1: AUTENTICAÇÃO
const authFirebaseConfig = {
  apiKey: "AIzaSyByuZxF0KhryOS1kSb4vh8W8bPwGjssIYg",
  authDomain: "turu-auth-53a38.firebaseapp.com",
  projectId: "turu-auth-53a38",
  storageBucket: "turu-auth-53a38.firebasestorage.app",
  messagingSenderId: "782168593551",
  appId: "1:782168593551:web:6c4e8295b391fa6c3b4cfa",
  measurementId: "G-NLR0E3BR2V"
};

// SERVIDOR 2: BANCO DE MENSAGENS
const msgFirebaseConfig = {
  apiKey: "AIzaSyCTLuYaX-oiL0OH76kIrvk80wHJ3mjiNEY",
  authDomain: "justmsg-e0a34.firebaseapp.com",
  projectId: "justmsg-e0a34",
  storageBucket: "justmsg-e0a34.firebasestorage.app",
  messagingSenderId: "891271826589",
  appId: "1:891271826589:web:b8e247c3f34e7b7b6f5874",
  measurementId: "G-XS2GKSCSPZ"
};

const authApp = initializeApp(authFirebaseConfig, "AUTH_APP");
const msgApp = initializeApp(msgFirebaseConfig, "MSG_APP");

const auth = getAuth(authApp);
const db = getFirestore(msgApp);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let userProfile = null;
let unsubscribeMessages = null;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const resourceType = file.type.startsWith("image/") ? "image" : "raw";
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Erro ao enviar arquivo para o Cloudinary.");
  }

  const data = await response.json();
  return data.secure_url;
}

document.addEventListener("DOMContentLoaded", () => {
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
  const headerAvatar = document.getElementById("header-avatar");
  const btnLogout = document.getElementById("btn-logout");

  const messagesContainer = document.getElementById("messages-container");
  const messageInput = document.getElementById("message-input");
  const fileInput = document.getElementById("file-input");
  const btnSend = document.getElementById("btn-send");

  const settingsModal = document.getElementById("settings-modal");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnSaveSettings = document.getElementById("btn-save-settings");
  const settingsName = document.getElementById("settings-name");
  const settingsPhone = document.getElementById("settings-phone");
  const avatarInput = document.getElementById("avatar-input");
  const settingsAvatarPreview = document.getElementById("settings-avatar-preview");

  if (goToSignUp) {
    goToSignUp.onclick = (e) => {
      e.preventDefault();
      loginPage.style.display = "none";
      registerPage.style.display = "flex";
    };
  }

  if (goToLogin) {
    goToLogin.onclick = (e) => {
      e.preventDefault();
      loginPage.style.display = "flex";
      registerPage.style.display = "none";
    };
  }

  function clearInputs() {
    if (emailLoginInput) emailLoginInput.value = "";
    if (passwordLoginInput) passwordLoginInput.value = "";
    if (emailRegInput) emailRegInput.value = "";
    if (passwordRegInput) passwordRegInput.value = "";
    if (messageInput) messageInput.value = "";
    if (fileInput) fileInput.value = "";
  }

  async function loadUserProfile(user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      userProfile = userSnap.data();
    } else {
      userProfile = {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        phone: "",
        photoUrl: user.photoURL || "https://via.placeholder.com/80"
      };
      await setDoc(userDocRef, userProfile);
    }

    if (userDisplay) userDisplay.textContent = userProfile.name;
    if (headerAvatar) headerAvatar.src = userProfile.photoUrl;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadUserProfile(user);

      if (loginPage) loginPage.style.display = "none";
      if (registerPage) registerPage.style.display = "none";
      if (chatContainer) chatContainer.style.display = "flex";

      loadMessages();
    } else {
      currentUser = null;
      userProfile = null;
      if (chatContainer) chatContainer.style.display = "none";
      if (loginPage) loginPage.style.display = "flex";

      if (unsubscribeMessages) unsubscribeMessages();
    }
  });

  if (btnSignup) {
    btnSignup.addEventListener("click", () => {
      const email = emailRegInput.value;
      const password = passwordRegInput.value;
      if (!email || !password) return alert("Preencha todos os campos!");

      createUserWithEmailAndPassword(auth, email, password)
        .then(() => clearInputs())
        .catch((err) => alert("Erro ao criar conta: " + err.message));
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const email = emailLoginInput.value;
      const password = passwordLoginInput.value;
      if (!email || !password) return alert("Preencha todos os campos!");

      signInWithEmailAndPassword(auth, email, password)
        .then(() => clearInputs())
        .catch((err) => alert("Erro ao entrar: " + err.message));
    });
  }

  googleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      signInWithPopup(auth, googleProvider)
        .then(() => clearInputs())
        .catch((err) => alert("Erro com Google: " + err.message));
    });
  });

  if (btnLogout) btnLogout.addEventListener("click", () => signOut(auth));

  if (btnOpenSettings) {
    btnOpenSettings.onclick = () => {
      if (settingsName) settingsName.value = userProfile.name || "";
      if (settingsPhone) settingsPhone.value = userProfile.phone || "";
      if (settingsAvatarPreview) settingsAvatarPreview.src = userProfile.photoUrl || "https://via.placeholder.com/80";
      if (settingsModal) settingsModal.style.display = "flex";
    };
  }

  if (btnCloseSettings) {
    btnCloseSettings.onclick = () => {
      if (settingsModal) settingsModal.style.display = "none";
    };
  }

  if (btnSaveSettings) {
    btnSaveSettings.onclick = async () => {
      btnSaveSettings.disabled = true;
      btnSaveSettings.textContent = "Salvando...";

      try {
        let photoUrl = userProfile.photoUrl;

        if (avatarInput && avatarInput.files[0]) {
          photoUrl = await uploadToCloudinary(avatarInput.files[0]);
        }

        const updatedData = {
          name: settingsName.value.trim() || userProfile.name,
          phone: settingsPhone.value.trim(),
          photoUrl: photoUrl
        };

        await setDoc(doc(db, "users", currentUser.uid), updatedData, { merge: true });
        
        userProfile = { ...userProfile, ...updatedData };
        if (userDisplay) userDisplay.textContent = userProfile.name;
        if (headerAvatar) headerAvatar.src = userProfile.photoUrl;

        if (settingsModal) settingsModal.style.display = "none";
      } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        alert("Erro ao salvar dados.");
      } finally {
        btnSaveSettings.disabled = false;
        btnSaveSettings.textContent = "Salvar";
      }
    };
  }

  async function sendMessage() {
    const text = messageInput ? messageInput.value.trim() : "";
    const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

    if (!text && !file) return;

    if (btnSend) btnSend.disabled = true;

    try {
      let fileUrl = null;
      let fileType = null;

      if (file) {
        fileUrl = await uploadToCloudinary(file);
        fileType = file.type.startsWith("image/") ? "image" : "file";
      }

      await addDoc(collection(db, "messages"), {
        text: text,
        fileUrl: fileUrl,
        fileType: fileType,
        senderName: userProfile ? userProfile.name : "Anônimo",
        senderAvatar: userProfile ? userProfile.photoUrl : "",
        uid: currentUser.uid,
        timestamp: serverTimestamp()
      });

      if (messageInput) messageInput.value = "";
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem.");
    } finally {
      if (btnSend) btnSend.disabled = false;
    }
  }

  if (btnSend) btnSend.addEventListener("click", sendMessage);
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  function loadMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
      if (!messagesContainer) return;
      messagesContainer.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const msg = docSnap.data();
        const isMyMsg = currentUser && msg.uid === currentUser.uid;

        const msgDiv = document.createElement("div");
        msgDiv.className = `msg-item ${isMyMsg ? "my-msg" : ""}`;

        let mediaHtml = "";
        if (msg.fileUrl) {
          if (msg.fileType === "image") {
            mediaHtml = `<img src="${msg.fileUrl}" class="msg-image" alt="Imagem enviada">`;
          } else {
            mediaHtml = `<a href="${msg.fileUrl}" target="_blank" class="msg-file-link">📁 Baixar Arquivo Anexo</a>`;
          }
        }

        msgDiv.innerHTML = `
          <span class="msg-sender">${msg.senderName || "Anônimo"}</span>
          ${msg.text ? `<div class="msg-text">${msg.text}</div>` : ""}
          ${mediaHtml}
        `;

        messagesContainer.appendChild(msgDiv);
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }
});
