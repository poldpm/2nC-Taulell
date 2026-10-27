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
de la pissarra on apunta el projector.

**Disposició lliure:** a *Aparença*, posa *Disposició → Lliure*, prem **⤢ Ampliar** a la vista prèvia i
arrossega cada mòdul a qualsevol lloc de la imatge projectada; estira la cantonada blava per canviar-ne la mida.
(En aquest mode, posició, amplada, marges i columnes no s'utilitzen: cada mòdul va on el poses.) La lletra de cada mòdul
s'ajusta sola a la seva caixa. **↺ Recol·locar** els torna a posar un sota l'altre. El botó **⬛ Pantalla en negre** deixa de projectar sense tocar res.

**⏰ Avisos programats:** missatges que surten en gran a sobre del taulell un dia i hora concrets i
desapareixen sols (p. ex. cada dimarts a les 15:55, «ALANA CAP A PORTERIA!» durant 10 minuts). Poden repetir-se
cada setmana els dies que triïs o sortir un sol dia; es poden pausar, provar a la vista prèvia o
**📽️ provar al projector** (es veu 30 segons al taulell de veritat).

**🕗 Horari de projecció:** fora de l'horari (per defecte, de dilluns a divendres de 08:30 a 16:45) el taulell
es posa en negre sol, i els caps de setmana es queda en negre. Es pot canviar o desactivar des del panell.

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

### Que el projector s'apagui i s'engegui sol

La pantalla en negre no apaga el projector: continua encès projectant negre. Per estalviar làmpada i
no haver-lo d'apagar cada dia, combina-ho així:

1. **Al menú del projector**, activa:
   - *Apagada automàtica* / *Auto Power Off* / *Sense senyal → standby* (p. ex. al cap de 5–10 minuts sense senyal).
   - *Encesa automàtica* / *Auto Power On* / *Signal Power On* / *Direct Power On* (s'encén quan rep senyal o corrent).
     El nom canvia segons la marca; si no hi és, mira el manual del model.
2. **Al miniordinador (Windows)**, programa que s'adormi en acabar i es desperti abans de començar,
   amb el *Programador de tasques*:
   - Tasca «Dormir»: cada dia de dilluns a divendres a les 16:50, acció
     `rundll32.exe powrprof.dll,SetSuspendState 0,1,0` (abans, a *Opcions d'energia*, desactiva la hibernació
     amb `powercfg -h off` perquè s'adormi i no hiberni).
   - Tasca «Despertar»: de dilluns a divendres a les 08:25, marcant *Desperta l'ordinador per executar aquesta tasca*
     (pestanya *Condicions*); l'acció pot ser simplement obrir el taulell.
   - A *Opcions d'energia → Configuració avançada → Suspendre → Permet temporitzadors de despertar*: **Activa**.

#### Epson EB-475Wi (el projector de 2n C)

Botó **Menu** → **Ampliado/Extended** → **Funcionament/Operation**:

- **Mode de repòs / Sleep Mode** → *Activat*, i **Temporitzador / Sleep Mode Timer** → *5 min*:
  s'apaga sol quan fa 5 minuts que no rep senyal.
- **Encesa directa / Direct Power On** → *Activat*: s'encén sol quan li arriba corrent.

Si al mateix menú hi trobes **Auto Power On** (encesa en rebre senyal), activa-la i no cal res més. Si no hi és,
per encendre'l sense tocar-lo cal un **endoll programable** (de temporitzador o wifi) entre la presa i el projector: corrent de dilluns a divendres de 08:20
a 17:15. Cronologia d'un dia: 08:20 arriba corrent → s'encén · 08:25 es desperta el miniordinador → projecta ·
16:45 el taulell es posa en negre · 16:50 l'ordinador s'adorm → 16:55 el projector passa a repòs i es refreda ·
17:15 l'endoll talla el corrent (amb el projector ja apagat i fred). No talleu mai el corrent amb la làmpada encesa.

Quan l'ordinador dorm, el projector deixa de rebre senyal i s'apaga sol; quan es desperta, li torna el senyal
i s'encén. Si el projector no té encesa automàtica, una alternativa és un endoll programable (amb temporitzador)
per al projector, sempre que el projector suporti *Direct Power On* (encendre's en rebre corrent).

Quan es publica una versió nova de l'app, el taulell la detecta i es recarrega sol en pocs minuts. També es recarrega cada matinada a les 5h, ajusta la lletra perquè tot hi càpiga i,
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
js/programats.js  Avisos programats
js/horari.js      Horari de projecció
js/admin.js       Lògica del panell
js/display.js     Lògica del taulell
firestore.rules   Qui pot llegir i escriure
manifest-*.webmanifest, sw.js, icons/   Instal·lació com a aplicació
```
