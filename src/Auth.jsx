import { useState } from "react";
import { auth, db } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Define a data de expiração para 30 dias a partir de hoje
      const hoje = new Date();
      const dataExpiracao = new Date(hoje);
      dataExpiracao.setDate(hoje.getDate() + 30);

      // Salvar no Firestore
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        email: email,
        data_inicio: hoje.toISOString(),
        data_expiracao: dataExpiracao.toISOString(),
        ativo: true
      });

      alert("Usuário registrado com sucesso!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Verifica a data de expiração no Firestore
      const docSnap = await getDoc(doc(db, "usuarios", userCredential.user.uid));

      if (docSnap.exists()) {
        const dataExpiracao = new Date(docSnap.data().data_expiracao);
        const hoje = new Date();

        if (hoje > dataExpiracao) {
          setIsAllowed(false);
          alert("Sua assinatura expirou! Renove para continuar.");
        } else {
          setIsAllowed(true);
          alert("Login realizado com sucesso!");
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAllowed(false);
    alert("Logout realizado!");
  };

  const handlePayment = async () => {
    if (!user || !user.email) {
      alert("Erro: usuário não autenticado!");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:3001/create_preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }), // Envia o e-mail correto do usuário
      });
  
      const data = await response.json();
  
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Erro ao gerar link de pagamento.");
      }
    } catch (error) {
      alert("Erro: " + error.message);
    }
  };
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold">Login / Registro</h1>
      {user ? (
        isAllowed ? (
          <div>
            <p>Bem-vindo, {user.email}!</p>
            <button onClick={handleLogout} className="bg-red-500 text-white p-2 mt-2">
              Logout
            </button>
          </div>
        ) : (
          <div>
            <p>Sua assinatura expirou! Renove para continuar.</p>
            <button onClick={handlePayment} className="bg-green-500 text-white p-2 mt-2">
              Pagar com Mercado Pago
            </button>
          </div>
        )
      ) : (
        <div>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mt-2"
          />
          <button onClick={handleLogin} className="bg-blue-500 text-white p-2 mt-2">
            Login
          </button>
          <button onClick={handleRegister} className="bg-green-500 text-white p-2 mt-2 ml-2">
            Registrar
          </button>
        </div>
      )}
    </div>
  );
}
