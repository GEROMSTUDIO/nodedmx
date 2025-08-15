// server.js
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 8080;

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Création du serveur HTTP
const server = http.createServer(app);

// Création du serveur WebSocket
const wss = new WebSocket.Server({ server });

// État des sliders (initialement à 0)
let sliderStates = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0
};

// Gestion des connexions WebSocket
wss.on('connection', (ws) => {
    console.log('Nouvelle connexion WebSocket');

    ws.on('message', (message) => {
        let msg = message.toString();
        console.log('Message reçu brut :', msg);

        try {
            // Essayer de parser en JSON
            let data;
            try {
                data = JSON.parse(msg);
            } catch {
                data = null;
            }

            // Si le message est "load" (ou {type:"load"})
            if (msg === 'load' || (data && data.type === 'load')) {
                const slidersArray = Object.entries(sliderStates).map(([slider, value]) => ({
                    slider: Number(slider),
                    value
                }));
                ws.send(JSON.stringify({ type: 'load', sliders: slidersArray }));
                return;
            }

            // Vérifier si c’est un message slider
            if (data && typeof data.slider === 'number' && typeof data.value === 'number') {
                // Mise à jour de l'état
                sliderStates[data.slider] = data.value;

                // Envoyer aux autres clients (sauf l'expéditeur)
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ slider: data.slider, value: data.value }));
                    }
                });
            }
        } catch (err) {
            console.error('Erreur de traitement du message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client déconnecté');
    });
});

// Lancement du serveur HTTP + WS
server.listen(port, () => {
    console.log(`Serveur HTTP/WS démarré sur http://localhost:${port}`);
});
