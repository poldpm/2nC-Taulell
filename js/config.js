// Configuració del taulell.
//
// firebaseConfig: l'objecte que dona Firebase (veure README.md, pas 1).
// Si fos `null`, l'app funcionaria en "MODE PROVA": tot es guardaria només en aquest navegador.
// Aquestes claus no són secretes: la seguretat la donen les regles de Firestore (firestore.rules).
export const firebaseConfig = {
  apiKey: 'AIzaSyAEAQ2obyTpUA0VSaJwfDczEHhusubIGXM',
  authDomain: 'taulell-2nc.firebaseapp.com',
  projectId: 'taulell-2nc',
  storageBucket: 'taulell-2nc.firebasestorage.app',
  messagingSenderId: '799056262239',
  appId: '1:799056262239:web:af1c585034a75327bd17ea',
};

// Identificador del taulell (permet tenir-ne més d'un en el futur, p. ex. un per curs).
export const TAULELL_ID = '2nC';
