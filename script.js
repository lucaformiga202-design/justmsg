// --- IMPORTAÇÕES DO FIREBASE (CDN ESM) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyByuZxF0KhryOS1kSb4vh8W8bPwGjssIYg",
  authDomain: "turu-auth-53a38.firebaseapp.com",
  projectId: "turu-auth-53a38",
  storageBucket: "turu-auth-53a38.firebasestorage.app",
  messagingSenderId: "782168593551",
  appId: "1:782168593551:web:6c4e8295b391fa6c3b4cfa",
  measurementId: "G-NLR0E3BR2V"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- TELA & NAVEGAÇÃO DE INTERFACE ---
const goToSignUp = document.getElementById("gotosignup");
const goToLogin = document.getElementById("gotologin");
const loginPage = document.getElementById("login");
const registerPage = document.getElementById("signup");

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

// --- CAPTURA DE ELEMENTOS DOS FORMULÁRIOS ---
// Login
const emailLoginInput = document.getElementById("email-login");
const passwordLoginInput = document.getElementById("password-login");
const btnLogin = document.getElementById("btn-login");

// Cadastro
const emailRegInput = document.getElementById("email-reg");
const passwordRegInput = document.getElementById("password-reg");
const btnSignup = document.getElementById("btn-signup");

// Botões do Google
const googleButtons = document.querySelectorAll(".btn-google");

// --- EVENTO DE CADASTRO COM EMAIL E SENHA ---
btnSignup.addEventListener("click", () => {
  const email = emailRegInput.value;
  const password = passwordRegInput.value;

  if (!email || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Conta criada com sucesso! Usuário: " + user.email);
    })
    .catch((error) => {
      console.error("Erro no cadastro:", error);
      alert("Erro ao criar conta: " + error.message);
    });
});

// --- EVENTO DE LOGIN COM EMAIL E SENHA ---
btnLogin.addEventListener("click", () => {
  const email = emailLoginInput.value;
  const password = passwordLoginInput.value;

  if (!email || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("Login efetuado com sucesso! Bem-vindo " + user.email);
    })
    .catch((error) => {
      console.error("Erro no login:", error);
      alert("Erro ao entrar: " + error.message);
    });
});

// --- EVENTO DE LOGIN COM GOOGLE ---
googleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;
        alert("Autenticado com sucesso via Google! Bem-vindo " + user.displayName);
      })
      .catch((error) => {
        console.error("Erro na autenticação com Google:", error);
        alert("Erro ao entrar com Google: " + error.message);
      });
  });
});
