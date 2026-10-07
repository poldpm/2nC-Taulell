# Taulell 2n C

Un taulell digital per projectar al lateral de la pissarra: les tasques "Quan acabis, pots fer...",
avisos, encarregats, la data i l'hora... Ja no s'esborra quan netegen la pissarra.

- **`admin.html` → Panell de control** (el teu ordinador): escrius, amagues, reordenes i decideixes què es projecta.
- **`taulell.html` → Taulell** (el miniordinador connectat al projector): mostra en directe el que decideixes.

Els canvis es desen sols i apareixen al projector en un o dos segons.

## Què hi ha

| Mòdul | Per a què |
|---|---|
| ✅ Tasques | La llista "Quan acabis, pots fer...". Amb icona, color, numeració (ordre recomanat), ⭐ destacar i 👁 amagar sense esborrar. |
| 📣 Avís destacat | Un missatge gran amb color ("Avui hi ha piscina!"). |
| 🧑‍🤝‍🧑 Encarregats | Qui fa cada feina de classe. |
| 📅 Agenda de la setmana | Què passa d'extraordinari cada dia (de dilluns a divendres). Avui queda destacat i els dies passats, més apagats. |
| 🕒 Data i hora | Rellotge i data en català. |
| 📝 Text lliure | Qualsevol altra cosa. |

Pots tenir més d'un mòdul del mateix tipus, ordenar-los, amagar-los i triar on es col·loquen
(esquerra/centre/dreta, amplada, marges i mida de lletra) per encaixar exactament amb la zona
de la pissarra on apunta el projector. El botó **⬛ Pantalla en negre** deixa de projectar sense tocar res.

A *Còpies de seguretat* pots tornar a una versió anterior o descarregar-ne una còpia.

## Provar-ho ara mateix (mode prova)

Sense configurar res, l'app funciona en **mode prova**: obre `admin.html` i `taulell.html` en dues
pestanyes del mateix navegador. Les dades només es guarden en aquell navegador.

## Posar-ho en marxa de veritat

### 1. Base de dades al núvol (Firebase, gratuït) — uns 10 minuts

Serveix perquè el teu ordinador i el del projector vegin el mateix, i perquè només tu puguis editar-ho.

1. Ves a <https://console.firebase.google.com> amb el teu compte de Google → **Crea un projecte**
   (p. ex. `taulell-2nc`). Google Analytics no cal.
2. Menú **Build → Firestore Database → Create database**. Ubicació `eur3 (europe-west)`, mode *production*.
3. A la pestanya **Rules** de Firestore, enganxa el contingut del fitxer [`firestore.rules`](firestore.rules)
   **canviant `EL_TEU_CORREU@gmail.com` pel teu correu** i prem *Publish*.
4. Menú **Build → Authentication → Get started → Google → Enable**.
5. ⚙️ **Project settings → General → Your apps → icona `</>` (Web)**. Posa-hi un nom i copia l'objecte
   `firebaseConfig` que et mostra. Enganxa'l a [`js/config.js`](js/config.js) en lloc de `null`.
   (Aquestes claus no són secretes: la seguretat la donen les regles del pas 3.)
6. **Authentication → Settings → Authorized domains → Add domain**: afegeix el domini on publiquis l'app
   (p. ex. `poldpm.github.io`).

> Si vols, envia'm el `firebaseConfig` i el correu i ho deixo configurat jo.

### 2. Publicar-ho a internet (GitHub Pages, gratuït)

Al repositori de GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, tria
la branca i la carpeta `/ (root)`. En un minut tindràs:

- Panell: `https://poldpm.github.io/2nC-Taulell/admin.html`
- Taulell: `https://poldpm.github.io/2nC-Taulell/taulell.html`

(Si el repositori és privat, GitHub Pages necessita un compte de pagament; alternativament es pot fer públic —
el contingut del taulell continua protegit per l'inici de sessió— o publicar-lo amb Firebase Hosting.)

### 3. El miniordinador del projector

1. Connecta'l al projector per HDMI i a la wifi de l'escola.
2. **El primer cop**, obre `taulell.html` amb Chrome o Edge *normal* i inicia sessió amb Google
   (amb el teu compte o amb un compte de classe que hagis afegit a `firestore.rules`). La sessió queda guardada.
3. Fes que s'obri sol a pantalla completa en engegar:
   - **Windows**: crea una drecera a `shell:startup` (Win+R) amb aquest destí:
     `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --noerrdialogs --disable-session-crashed-bubble https://poldpm.github.io/2nC-Taulell/taulell.html`
     (amb Edge: `msedge.exe --kiosk https://... --edge-kiosk-type=fullscreen`).
   - **Linux**: afegeix `chromium --kiosk --noerrdialogs https://...` a les aplicacions d'inici.
4. Ajustos recomanats:
   - Energia: pantalla i suspensió → **Mai**.
   - Inici de sessió automàtic de l'usuari de l'ordinador.
   - A la BIOS, *Restore on AC power loss* → **Power On**: si engegues tot amb una regleta, l'ordinador arrenca sol.
   - Desactiva les actualitzacions automàtiques en horari lectiu si el sistema ho permet.

Per sortir del mode quiosc: `Alt+F4`.

El taulell es recarrega sol cada matinada a les 5h, ajusta la lletra perquè tot hi càpiga i,
si cau la connexió, continua mostrant l'últim contingut (amb una petita 📡 a la cantonada).

## Instal·lar-ho com a aplicació

El panell i el taulell es poden instal·lar com a aplicacions, amb la seva icona, sense barra del navegador:

- **Panell (el teu ordinador)**: obre `admin.html` amb Chrome o Edge i clica la icona d'instal·lar
  que surt a la dreta de la barra d'adreces (o menú ⋮ → *Desa i comparteix* → *Instal·la la pàgina com a aplicació*).
  Quedarà a l'escriptori i al menú d'inici com a **Panell 2n C**.
- **Taulell (el miniordinador)**: fes el mateix amb `taulell.html`. S'instal·la com a **Taulell 2n C** i s'obre a
  pantalla completa. A `chrome://apps` (clic dret → *Obre a l'inici de sessió*) o a Edge (*Aplicacions* →
  *Inicia automàticament*) pots fer que s'obri sol en engegar l'ordinador.
- **Mòbil / tauleta**: menú del navegador → *Afegeix a la pantalla d'inici*.

## Afegir mòduls nous

Cada mòdul és una entrada a `TYPES` dins de [`js/modules.js`](js/modules.js), amb la seva funció per pintar-lo
al taulell i el seu formulari al panell. Idees: temporitzador / compte enrere, horari del dia, menjador,
aniversaris del mes, semàfor de soroll, "paraula del dia"...

## Estructura

```
index.html        Portada amb enllaços
admin.html        Panell de control
taulell.html      Taulell projectat
js/config.js      Configuració de Firebase
js/store.js       Desar/carregar (Firebase o mode prova)
js/state.js       Estat per defecte
js/modules.js     Definició dels mòduls
js/admin.js       Lògica del panell
js/display.js     Lògica del taulell
firestore.rules   Qui pot llegir i escriure
manifest-*.webmanifest, sw.js, icons/   Instal·lació com a aplicació
```
