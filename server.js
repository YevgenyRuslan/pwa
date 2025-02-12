import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { db } from "./src/firebaseConfig.js";
import { updateDoc, collection, query, where, getDocs } from "firebase/firestore";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Configuração correta do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

app.get("/", (req, res) => {
  res.send("Servidor do Mercado Pago rodando!");
});

app.post("/create_preference", async (req, res) => {
  try {
    const { email } = req.body; // Pegamos o email enviado pelo frontend

    if (!email) {
      return res.status(400).json({ error: "E-mail do usuário é obrigatório!" });
    }

    const preference = {
      items: [
        {
          title: "Renovação de Assinatura - PWA Jogos",
          unit_price: 5.0,
          quantity: 1,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: email, // Agora usamos o e-mail real do usuário
      },
      back_urls: {
        success: "http://localhost:5173/sucesso",
        failure: "http://localhost:5173/falha",
        pending: "http://localhost:5173/pendente",
      },
      auto_return: "approved",
      notification_url: "http://localhost:3001/webhook",
    };

    const preferenceInstance = new Preference(client);
    const result = await preferenceInstance.create({ body: preference });

    res.json({
      id: result.id,
      checkoutUrl: result.init_point,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: error.message });
  }
});


// Webhook para capturar pagamentos aprovados e atualizar Firestore
app.post("/webhook", async (req, res) => {
  if (req.body?.data?.id) {
    const paymentId = req.body.data.id;
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${client.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userEmail = data.payer.email;

        if (data.status === "approved") {
          console.log("✅ Pagamento aprovado para:", userEmail);

          // Buscar o usuário no Firestore pelo email
          const usersRef = collection(db, "usuarios");
          const q = query(usersRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(async (docSnap) => {
            const novaDataExpiracao = new Date();
            novaDataExpiracao.setDate(novaDataExpiracao.getDate() + 30);

            await updateDoc(docSnap.ref, {
              data_expiracao: novaDataExpiracao.toISOString(),
              ativo: true,
            });

            console.log(`✅ Assinatura do usuário ${userEmail} renovada com sucesso!`);
          });
        } else {
          console.log("❌ Pagamento não aprovado:", data.status);
        }
      } else {
        console.log("Erro ao buscar detalhes do pagamento no Mercado Pago.");
      }
      res.sendStatus(200);
    } catch (error) {
      console.error("❌ Erro no Webhook:", error);
      res.sendStatus(500);
    }
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});
