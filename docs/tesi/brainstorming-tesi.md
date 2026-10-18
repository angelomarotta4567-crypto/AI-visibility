# Brainstorming tesi: visibilità delle attività locali nei motori generativi

> Schema di lavoro tratto dal podcast del 17 ottobre 2026. Legenda: **[C]** certo / verificato · **[P]** probabile · **[I]** ipotesi da verificare.
> Da adattare dopo il colloquio con il relatore: il corso di laurea cambia taglio, metodi e lunghezza.

---

## 0. Da sbloccare prima di tutto
- [ ] Corso di laurea + regolamento tesi (pagine, scadenze, sessione di laurea)
- [ ] 2 relatori possibili (marketing digitale / dati / AI): email + foglio di 1 pagina
- [ ] Verifica del "buco": ricerca seria su Google Scholar + Semantic Scholar per *local business* + *generative engine* / *LLM search* / *AI Overviews* **[I]**
- [ ] Decidere il taglio: tesi **B** (motori e fonti) come nucleo + **A** (misura) come metodo + **C** (interventi) esplorativa

---

## 1. Titolo e domande di ricerca

**Titolo di lavoro:** *Tre motori, tre visibilità? Come ChatGPT, Gemini e Perplexity raccomandano le attività locali. Uno studio sui dentisti della provincia di Bergamo*

| Codice | Domanda | Tipo | Dipende dalle vendite? |
|---|---|---|---|
| **RQ1** (A) | Quanto è affidabile una misura di visibilità locale? Quante ripetizioni e domande servono? | Metodologica | No |
| **RQ2** (B) | I tre motori concordano su chi raccomandare? Da quali fonti dipende ciascuno? Quanto sono concentrate le risposte? | Descrittiva / comparativa | No |
| **RQ3** (C) | Gli interventi di SEO locale cambiano la visibilità nei motori generativi? | Causale esplorativa | Sì (piloti) |

**Ipotesi da testare**
- H1 **[I]**: con 3 ripetizioni l'errore sulla visibilità di un singolo studio supera ±5 punti percentuali.
- H2 **[I]**: l'accordo tra motori su "chi viene nominato" è basso (Jaccard top-3 < 0,3).
- H3 **[I]**: Gemini dipende di più dalla scheda Google, Perplexity da portali e directory, ChatGPT dai siti propri e dagli articoli "i migliori…".
- H4 **[I]**: le risposte sono più concentrate (HHI più alto) dell'elenco locale di Google per la stessa ricerca.
- H5 **[I]**: completezza della scheda Google, numero di recensioni e profilo MioDottore completo aumentano la probabilità di essere nominati.
- H6 **[I]**: dopo gli interventi i piloti migliorano più dei controlli (DiD > 0).

---

## 2. Cosa dire nella tesi (contenuti per capitolo)

### Cap. 1: Introduzione
- Da lista di link a risposta: l'utente non sceglie più tra 10 risultati, il sistema sceglie per lui → inclusione/esclusione
- Calo dei clic quando c'è una risposta AI **[P]** (citare la fonte primaria, non un numero a memoria)
- Perché le attività locali: valore alto di un cliente (dentista), scelta "ragionata", fonti specifiche (Google, MioDottore)
- Problema: si vende "visibilità AI" senza un metodo di misura validato
- Contributo atteso + struttura della tesi

### Cap. 2: Stato dell'arte
- **Vocabolario:** SEO, Local SEO (pertinenza, distanza, notorietà **[C]**), AEO, GEO, LLMO
- **Come funziona una risposta:** conoscenza parametrica vs recupero (RAG, Lewis et al. 2020 **[C]**); grounding; 5 fasi: riformulazione → recupero → selezione → sintesi → citazione
- **Limiti noti:** *lost in the middle* (Liu et al. 2023 **[C]**); citazioni non sempre verificabili (Liu et al., Stanford 2023 **[C]**); non-determinismo
- **GEO:** Aggarwal et al., KDD 2024 **[C]**: GEO-bench, interventi (citazioni, statistiche, quotazioni), keyword stuffing inefficace **[P]**; limiti: ambiente controllato, domande generiche, non locale
- **Manipolazione:** Kumar & Lakkaraju 2024 (sequenze di testo strategiche) **[P]**; ranking manipulation nei motori conversazionali
- **2026:** rassegna critica 2023–2026 (visibilità = più variabili distinte); *Don't Measure Once* (visibilità = distribuzione); brand visibility at scale (siti aziendali e articoli "i migliori" più citati); citation failures. Tutti **preprint**
- **Sintesi:** nessuna tecnica con effetto causale stabile e cross-piattaforma **[P]**; nessuno studio peer-reviewed sulle attività locali **[I]**
- Letteratura grigia: separata e dichiarata

### Cap. 3: Metodologia
- Disegno: studio osservazionale ripetuto + studio di caso multiplo (piloti)
- Popolazione: dentisti di 17 comuni (Dalmine e dintorni, esclusa Bergamo città); fonte elenco: Google Places / MioDottore
- Protocollo: 20 domande generiche senza nome dello studio · 3 motori · *k* ripetizioni · date fisse (T0, T45, T90)
- Strumento: il tuo software (adapter per motore, ricerca web attiva, salvataggio di testo, fonti, id risposta, versione del modello)
- Classificazione: assente / solo fonte / alternativa / primo citato; alias dei nomi
- Metriche (vedi §3)
- **Preregistrazione** su OSF prima della raccolta **[C: la piattaforma esiste]**
- Etica: anonimizzazione (Studio A, B…), nessun dato di pazienti, conflitto d'interessi dichiarato, parere comitato etico se richiesto

### Cap. 4: Affidabilità della misura (RQ1)
- Variabilità tra ripetizioni, domande, motori, tempo
- Curva "errore vs numero di ripetizioni" (bootstrap)
- Scomposizione della varianza
- Validazione del riconoscimento dei nomi (precisione/richiamo)
- Confronto API vs app (campione manuale)
- **Output:** regola pratica + protocollo raccomandato

### Cap. 5: Motori e fonti (RQ2)
- Accordo tra motori; concentrazione; tipologia di fonti per motore
- Correlati della visibilità (recensioni, completezza schede, sito, dati strutturati)
- Esempio già disponibile (14 ott): Agnisetta 34/60 Perplexity vs 2/60 ChatGPT; Ghezzi 24/60 Gemini vs 0/0; B.G. 15/60 Perplexity vs 0/0

### Cap. 6: Interventi (RQ3, esplorativo)
- Piloti = trattati; dentisti misurati non clienti = controlli
- DiD + serie temporale interrotta; micro-esperimenti a leva singola (es. solo dati strutturati sul "profilo palestra")
- Risultati riportati anche se nulli o negativi

### Cap. 7: Discussione e conclusioni
- Cosa significa per chi misura (protocollo minimo), per le attività (fonti diverse per motori diversi), per la ricerca
- Limiti: campione, un solo settore e una sola provincia, sistemi che cambiano, API ≠ app, nessuna posizione geografica
- Sviluppi: altri settori (fisioterapisti, veterinari), altre province, serie storica lunga

---

## 3. Analisi tecniche da fare

### 3.1 Metriche (definizioni da scrivere nel cap. 3)
| Metrica | Formula / definizione | Uso |
|---|---|---|
| Tasso di visibilità VR | menzioni ÷ risposte (per studio, motore) | misura base |
| Intervallo di Wilson 95% | per proporzioni piccole (es. 2/60 → ~1–11%) | incertezza di ogni VR |
| Punteggio di rilievo | primo = 3, alternativa = 2, solo fonte = 1, assente = 0; media sulle risposte | qualità della presenza |
| Quota di voce SoV | menzioni studio ÷ menzioni di tutti gli studi del comune | confronto competitivo |
| HHI | Σ (SoV_i)² | concentrazione delle raccomandazioni |
| Jaccard top-k | \|A∩B\| ÷ \|A∪B\| tra gli insiemi dei più citati per motore | accordo tra motori |
| Spearman ρ | correlazione tra le classifiche dei motori | accordo sull'ordine |
| Fleiss/Cohen κ | accordo su presenza/assenza tra motori o tra codificatori | accordo oltre il caso |
| ICC | quota di varianza dovuta a studio vs domanda vs ripetizione | stabilità |

### 3.2 Analisi per domanda di ricerca
**RQ1: misura**
- [ ] Esperimento ripetizioni: 2–3 studi × 20 domande × 3 motori × **20 ripetizioni**
- [ ] Bootstrap: per k = 1, 3, 5, 10, 20 ripetizioni → distribuzione di VR → errore medio vs k
- [ ] Scomposizione varianza: modello a effetti misti `menzione ~ motore + (1|studio) + (1|domanda) + (1|ripetizione)`, logistico
- [ ] Sensibilità alla formulazione: VR per singola domanda; quali domande producono nomi e quali risposte generiche
- [ ] Deriva temporale: stessa misura a T0/T45/T90 sui controlli; registrare `model` per ogni risposta
- [ ] Validazione del matcher: campione stratificato di ~300 risposte codificate a mano → precisione, richiamo; secondo codificatore su 100 → κ
- [ ] API vs app: 20 domande ripetute a mano nelle app (senza login, posizione indicata) vs API → concordanza

**RQ2: motori e fonti**
- [ ] Matrice studio × motore dei VR per tutti i dentisti dei 17 comuni
- [ ] Jaccard top-3 e Spearman tra coppie di motori, per comune
- [ ] HHI per comune e per motore; confronto con l'elenco locale di Google (Places) **[I: va trovato un modo legittimo per ottenerlo]**
- [ ] Classificazione dei domini citati: Google/Maps · MioDottore · directory (PagineGialle…) · sito proprio · stampa locale · articoli "i migliori" · altro
- [ ] Test χ² di indipendenza motore × tipo di fonte
- [ ] Gemini: analisi delle `webSearchQueries` (come riformula le domande locali)
- [ ] Correlati: regressione logistica a effetti misti `menzione ~ n_recensioni + rating + completezza_GBP + completezza_MioDottore + sito + schema + motore + (1|domanda)`. Attenzione: n piccolo, interpretare come associazioni

**RQ3: interventi**
- [ ] Gruppi: trattati (piloti) vs controlli (stessi comuni, simili per VR iniziale)
- [ ] Misure a T0, T45, T90 (più punti se possibile)
- [ ] DiD: (VR_trattati,T90 − VR_trattati,T0) − (VR_controlli,T90 − VR_controlli,T0), con IC bootstrap
- [ ] Serie temporale interrotta per ciascun pilota
- [ ] Diario degli interventi: cosa, quando, su quale piattaforma (necessario per interpretare)
- [ ] Micro-esperimento a leva singola sul profilo palestra

### 3.3 Lavoro tecnico sul software e sui dati
- [ ] Export da Supabase a CSV/Parquet: una riga per risposta (studio, comune, motore, domanda, ripetizione, data, modello, response_id, testo, fonti, classificazione)
- [ ] Dizionario dei dati (README del dataset)
- [ ] Notebook di analisi (Python: pandas, statsmodels, scipy · oppure R)
- [ ] Strumento di prospezione dei 17 comuni (riusato come raccolta dati della tesi)
- [ ] Correzioni già individuate: catene di misura bloccate in parallelo; studio tra i propri concorrenti (Ghezzi)
- [ ] Congelare il protocollo: set di domande versionato, nessuna modifica durante la raccolta
- [ ] Backup dei dati grezzi con data (riproducibilità)

---

## 4. Cosa studiare (in ordine)
1. **Basi:** Jurafsky & Martin, *Speech and Language Processing* (cap. modelli linguistici, information retrieval; gratuito online **[C]**) · Lewis et al. 2020 (RAG) · Liu et al. 2023 (*Lost in the Middle*)
2. **GEO:** Aggarwal et al. 2024 → rassegna critica 2026 → *Don't Measure Once* → Liu et al. 2023 (verifiability) → lavori sulla manipolazione
3. **Local SEO:** documentazione Google sul ranking locale · indagini Whitespark (sondaggio tra esperti, non esperimento)
4. **Statistica:** proporzioni e Wilson · bootstrap · dimensione del campione · κ di Cohen/Fleiss · HHI · modelli logistici a effetti misti · DiD (Angrist & Pischke, *Mastering Metrics*)
5. **Metodo:** domanda di ricerca e protocollo · studio di caso (R. Yin) · preregistrazione (OSF)
6. **Strumenti:** Google Scholar, Semantic Scholar, arXiv, **Zotero** (subito)

**Scheda di lettura (½ pagina):** domanda · metodo · dati · risultato · limiti · cosa uso io

---

## 5. Rischi e come gestirli
| Rischio | Gestione |
|---|---|
| Il "buco" locale non esiste | Spostarsi su RQ1 (misura) o su un sotto-aspetto (fonti locali italiane) |
| Pochi o nessun pilota | RQ3 diventa micro-esperimenti sul profilo palestra; A+B reggono da sole |
| I modelli cambiano durante la raccolta | Registrare la versione; i controlli assorbono gli shock comuni (DiD) |
| Costi API | Stimare prima: risposte × costo unitario; ridurre ripetizioni solo dopo RQ1 |
| Conflitto d'interessi | Dichiararlo, preregistrare, pubblicare i risultati nulli |
| Privacy | Nomi anonimi senza liberatoria; mai dati di pazienti |
| Sessione esami di gennaio | Raccolta automatica in quel periodo; analisi e scrittura dopo |

---

## 6. Calendario (proposta)
| Quando | Cosa |
|---|---|
| entro fine ottobre | Colloquio relatori · foglio di 1 pagina · Zotero |
| novembre | Letture blocchi 1–2 + schede · verifica del buco · protocollo + preregistrazione · **T0** su tutti i dentisti dei 17 comuni |
| dicembre | **T45** · esperimento ripetizioni · codifica manuale campione |
| gennaio | Sessione esami: solo raccolta automatica · API vs app |
| febbraio | **T90** · chiusura raccolta |
| marzo–aprile | Analisi · scrittura · revisione con il relatore |

## 7. Il foglio di 1 pagina per il relatore
- Titolo provvisorio + 3 righe sulla domanda (RQ2 + RQ1)
- 3 righe su cosa esiste già (strumento, 180 risposte/studio, 3 motori)
- I numeri del 14 ottobre (tabella 4 studi × 3 motori)
- Calendario in 4 righe
- Cosa chiedi: disponibilità, taglio (economico/informatico), metodi richiesti
