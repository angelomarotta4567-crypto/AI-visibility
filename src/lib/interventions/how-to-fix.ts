export type HowToFix = {
  /** Cosa significa il problema, in parole semplici -- mai gergo tecnico crudo. */
  meaning: string;
  /** Passi concreti per risolverlo, pensati per chi non è uno sviluppatore
   * (a volte "chiedi a chi gestisce il sito", a volte qualcosa che il
   * titolare può fare da solo). */
  fix: string;
};

// Spiegazioni per ogni possibile finding della Diagnosi (src/lib/diagnosis/run.ts)
// e per ogni leva dei playbook per segmento (src/lib/interventions/levers.ts).
// Chiave = il "title" esatto del finding/leva, così la UI può fare un lookup
// diretto senza dover mantenere due elenchi sincronizzati a mano.
export const HOW_TO_FIX: Record<string, HowToFix> = {
  "Sito non raggiungibile": {
    meaning:
      "Quando qualcuno (un cliente, ma anche un motore AI) prova a caricare il sito, il sito non risponde o dà errore. Se il sito non si apre, nessuna delle informazioni sull'azienda può essere letta da nessuno.",
    fix: "Verifica prima di tutto che il sito si apra da un browser normale. Se si apre per te ma non per il nostro controllo automatico, il sito potrebbe avere una protezione anti-robot troppo aggressiva: chiedi a chi gestisce l'hosting di consentire l'accesso a crawler generici. Se non si apre nemmeno per te, contatta il tuo fornitore di hosting o sito web: è la priorità numero uno, prima di qualunque altra correzione.",
  },
  "Tempo di risposta elevato": {
    meaning:
      "Il sito impiega troppo tempo a caricarsi. Un sito lento scoraggia sia i visitatori umani sia i motori automatici, che a volte rinunciano a leggerlo del tutto.",
    fix: "Chiedi a chi gestisce il sito di controllare le immagini (spesso troppo pesanti) e il servizio di hosting. Spesso basta comprimere le immagini più grandi o passare a un hosting più veloce.",
  },
  "robots.txt blocca l'intero sito": {
    meaning:
      "Il sito ha un file di configurazione che dice esplicitamente a tutti i motori automatici \"non leggetemi\". È come mettere un cartello \"vietato l'ingresso\" sulla porta di casa e poi lamentarsi che nessuno viene a trovarti.",
    fix: "Chiedi a chi gestisce il sito di modificare il file robots.txt rimuovendo il blocco generale. Di solito è un intervento di pochi minuti per chi ha accesso al sito.",
  },
  "Meta tag noindex sulla homepage": {
    meaning:
      "La pagina principale del sito contiene un'istruzione esplicita che dice ai motori di ricerca \"non indicizzarmi\". Probabilmente è rimasta attiva per errore (capita spesso dopo lavori di manutenzione sul sito).",
    fix: "Chiedi a chi gestisce il sito di rimuovere l'istruzione \"noindex\" dalla homepage. È una modifica piccola ma con effetto grande.",
  },
  "Sitemap.xml assente": {
    meaning:
      "Manca una \"mappa\" del sito che elenca tutte le pagine esistenti. Senza questa mappa, un motore automatico fa più fatica a scoprire tutte le pagine dell'azienda (non solo la homepage).",
    fix: "Chiedi a chi gestisce il sito di generare e pubblicare un file sitemap.xml -- quasi tutti i sistemi con cui si costruiscono siti (WordPress, Wix, Shopify...) lo fanno automaticamente con un plugin o un'impostazione da attivare.",
  },
  "Nessun dato strutturato (JSON-LD)": {
    meaning:
      "Il sito non contiene un blocco di informazioni scritte in un formato che i motori AI possono leggere direttamente come fatti certi (nome azienda, indirizzo, orari, categoria...). Senza questo, un motore deve \"indovinare\" le informazioni leggendo il testo normale della pagina, con più margine di errore.",
    fix: "Chiedi a chi gestisce il sito di aggiungere un blocco di dati strutturati (\"JSON-LD\", tipo LocalBusiness o Organization) nella homepage, con nome, indirizzo, telefono, orari e categoria dell'azienda. Molti temi WordPress e plugin SEO lo generano automaticamente una volta compilati i dati dell'attività.",
  },
  "Dati strutturati presenti ma non pertinenti": {
    meaning:
      "Il sito ha già dei dati strutturati, ma non del tipo giusto per il tipo di attività -- come avere un cartello ben scritto ma con le informazioni sbagliate.",
    fix: "Chiedi a chi gestisce il sito di verificare che il tipo di dato strutturato usato corrisponda davvero all'attività (es. LocalBusiness per un negozio fisico, Product per un e-commerce).",
  },
  "Title o meta description mancanti": {
    meaning:
      "Mancano il titolo e la breve descrizione che normalmente compaiono nei risultati di ricerca e che un motore usa come primo riassunto di cosa fa l'azienda.",
    fix: "Chiedi a chi gestisce il sito di compilare titolo e descrizione della homepage: bastano una frase con nome e attività, e 1-2 frasi che riassumono cosa offre l'azienda e dove si trova.",
  },
  "Nessun contatto (telefono) visibile in homepage": {
    meaning:
      "Il numero di telefono dell'azienda non compare nel testo della pagina principale -- un segnale che i motori usano per confermare che un'attività è reale e raggiungibile.",
    fix: "Aggiungi (o chiedi di aggiungere) il numero di telefono in un punto ben visibile della homepage, non solo in un'immagine o in un modulo di contatto.",
  },
  "Coerenza NAP su fonti esterne non verificata": {
    meaning:
      "\"NAP\" sta per Nome, Indirizzo, Telefono. Questo controllo verifica solo il sito dell'azienda: non abbiamo ancora modo di confrontare automaticamente questi dati con Google Business Profile, le directory di settore e i social -- se sono scritti in modo diverso da una fonte all'altra, un motore AI può fare più fatica a essere sicuro che si tratti della stessa azienda.",
    fix: "Controlla a mano che nome, indirizzo e telefono siano scritti in modo identico (stesse abbreviazioni, stesso formato) su sito, Google Business Profile, Facebook/Instagram e le directory di settore in cui l'azienda è presente.",
  },
  "Coerenza NAP su tutte le piattaforme": {
    meaning:
      "Se il nome dell'azienda, l'indirizzo o il telefono sono scritti in modo leggermente diverso sul sito, su Google, sui social e sulle directory di settore, un motore AI può avere dubbi sul fatto che si tratti della stessa attività -- e nel dubbio, spesso non la cita.",
    fix: "Fai un giro veloce su Google Business Profile, Facebook, Instagram e le directory dove l'azienda è registrata: copia-incolla lo stesso identico nome, indirizzo e numero di telefono ovunque, senza abbreviazioni diverse da un posto all'altro.",
  },
  "Dati strutturati LocalBusiness": {
    meaning:
      "È lo stesso concetto del \"JSON-LD\" spiegato sopra, applicato in particolare al tipo \"attività locale\": indirizzo, orari di apertura, categoria e fascia di prezzo scritti in un formato leggibile direttamente da un motore, non solo in un testo discorsivo.",
    fix: "Chiedi a chi gestisce il sito di aggiungere il markup Schema.org di tipo LocalBusiness in homepage, con indirizzo, orari e categoria compilati.",
  },
  "Recensioni verificate e recenti": {
    meaning:
      "I motori AI usano le recensioni recenti come segnale che un'attività è reale, attiva e apprezzata. Poche recensioni, o recensioni vecchie, pesano meno nella risposta di un motore.",
    fix: "Chiedi attivamente ai clienti soddisfatti una recensione su Google Business Profile dopo ogni acquisto/servizio -- anche solo 1-2 recensioni nuove al mese fanno una differenza reale nel tempo.",
  },
  "Orari e prezzo sempre aggiornati": {
    meaning:
      "Se gli orari o i prezzi scritti online (sito, Google, directory) non sono più veri, un motore AI può escludere l'attività da una risposta proprio per evitare di dare un'informazione sbagliata a chi chiede.",
    fix: "Controlla e aggiorna periodicamente orari e prezzi ovunque compaiano online: sito, Google Business Profile, directory di settore. È uno dei controlli più semplici e più trascurati.",
  },
  "Feed prodotto strutturato e coerente": {
    meaning:
      "Per un negozio online, questo vuol dire che le informazioni sui prodotti (nome, prezzo, disponibilità) devono essere scritte in un formato leggibile automaticamente, e devono essere identiche tra catalogo, feed e pagina prodotto.",
    fix: "Chiedi a chi gestisce l'e-commerce di verificare il markup Schema.org Product/Offer su ogni pagina prodotto, e che prezzo/disponibilità coincidano sempre con quelli mostrati nel feed usato per le pubblicità o i comparatori prezzi.",
  },
  "Contenuti comparativi in formato risposta diretta": {
    meaning:
      "Chi cerca online spesso confronta prodotti/opzioni prima di comprare (\"X vs Y\", \"il migliore per...\"). Se il sito ha solo pagine promozionali e nessun contenuto che risponde direttamente a questo tipo di domanda, un motore AI non ha nulla da citare quando qualcuno fa quella domanda.",
    fix: "Scrivi (o fai scrivere) 2-3 pagine o articoli che rispondano direttamente a domande comparative reali del tuo settore -- non pagine di vendita, ma contenuti onesti che aiutano chi sta decidendo.",
  },
  "Recensioni prodotto aggregate e verificabili": {
    meaning:
      "Se le recensioni dei prodotti non sono esposte in modo strutturato e verificabile su ogni pagina prodotto, un motore fa più fatica a usarle come segnale di affidabilità.",
    fix: "Attiva (o chiedi di attivare) un sistema di recensioni prodotto che mostri un punteggio aggregato visibile su ogni pagina prodotto, non solo su una pagina generale.",
  },
  "Freshness di prezzo e disponibilità": {
    meaning:
      "Se il prezzo o la disponibilità mostrati sul sito non coincidono con quelli reali (magari perché il feed non si aggiorna abbastanza spesso), un motore può smettere di fidarsi di quella fonte.",
    fix: "Verifica che il feed prodotti si aggiorni automaticamente e frequentemente, così prezzo e disponibilità sul sito sono sempre allineati alla realtà.",
  },
  "Autorevolezza da fonti terze": {
    meaning:
      "Per un'azienda B2B, un motore AI dà più peso a chi viene citato da fonti esterne indipendenti (rassegna stampa, partnership, casi di successo pubblicati da altri) rispetto a chi parla solo di sé sul proprio sito.",
    fix: "Cerca occasioni concrete di essere citato altrove: comunicati stampa, partnership rese pubbliche, interviste di settore, casi studio pubblicati insieme a un cliente disposto a testimoniare.",
  },
  "Contenuti tecnici in formato estraibile": {
    meaning:
      "Se le informazioni tecniche importanti sono chiuse solo in PDF scaricabili, un motore AI fa più fatica a leggerle ed estrarne fatti verificabili rispetto a contenuti pubblicati come pagine web normali.",
    fix: "Pubblica le informazioni tecniche più importanti (schede prodotto, whitepaper, casi d'uso) anche come pagine web normali, non solo come PDF da scaricare.",
  },
  "Coerenza tra sito, LinkedIn e fonti di settore": {
    meaning:
      "Se la descrizione dell'azienda, delle competenze o dei casi d'uso cambia tra sito, LinkedIn e altre fonti di settore, un motore AI ha più difficoltà a costruirsi un quadro chiaro e coerente dell'azienda.",
    fix: "Rileggi e allinea la descrizione dell'azienda (cosa fa, per chi, con quali competenze) su sito, LinkedIn aziendale e i profili di settore in cui l'azienda compare.",
  },
};
