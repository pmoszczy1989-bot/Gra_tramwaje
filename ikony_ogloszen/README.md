# Ikony ogłoszeń i połączeń głosowych nad kabiną — materiały z MWL_THT

Ten folder przenosi do oryginału gry (`mpk-wroclaw`) funkcję, która została dodana
w wersji gry wbudowanej w **MWL_THT v6.3.4** („🚋 Trasa na żywo”) oraz w **Symulacji
jazdy v1.0.4**. Pliki gry w `mpk-wroclaw\` **nie zostały zmienione** — tu są tylko
gotowe fragmenty kodu, zrzuty z terminala kierowcy i opis.

## Do czego to służy

Gdy gra jest połączona z prawdziwym pojazdem (ECU, SOMA/MQTT), nad kabiną własnego
pojazdu pojawia się ikona — **taka sama jak na terminalu kierowcy** (driver GUI) — gdy:

* trwa **połączenie głosowe z dyspozytorem (CC)**: RTT / PRTT / CA,
* trwa **ogłoszenie**: kierowcy (głośniki wewn./zewn./oba), dyspozytora („Durchsage”
  do kierowcy / pasażerów / obu), **zapowiedź przystanku** albo komunikat tylko na
  głośnik kierowcy.

Dzięki temu w grze od razu widać, co w tej chwili „gra” w pojeździe. Ikony znikają,
gdy ogłoszenie/połączenie się skończy. W trybie demo (bez pojazdu) nic się nie pokazuje.

## Pliki

| Plik | Zawartość |
|---|---|
| `ikony_render.js` | Rysowanie: glify pikselowe (`CALL_GLYPH`, `ANN_GLYPH`), `glyphAt`, `disc`, `drawCallIcon`, `drawAnnIcon`, `drawAnnGroup` + opis wpięcia w `draw()` |
| `ikony_live.js` | Logika: `callInfo(s)` → `G.call`, `annInfo(s)` → `G.ann` (ze stanu SOMA) |
| `dekodery_SOMA.cpp` | Dekodery C++ binarnych zmiennych `Dat_Acstc.AcousticState` i `Dat_Acstc.ActiveRequests` (strona aplikacji Qt) + lista `put()` |
| `zrzuty_terminala\` | Zrzuty ikon z prawdziwego terminala kierowcy (VNC) i podgląd ikony w grze |

## Jak wpiąć w grę

1. Dodaj zawartość `ikony_render.js` do `render.js` (przed główną funkcją rysującą).
   Kod używa istniejących funkcji gry: `R(x,y,w,h,col)`, `ptext(...)`, `ctx`.
2. W `draw()`:
   * przy rysowaniu własnego pojazdu ustaw pozycję ikony:
     `G._callAt = G.call || G.ann ? [x1 - 7, yb - (G.mode === 'tram' ? 50 : 46 + (V.tall || 0))] : null;`
     (`x1` = prawy koniec pojazdu na ekranie = kabina, `yb` = dół pojazdu),
   * na końcu sceny (po przyciemnieniu nocy, przed pogodą):
     `if (G._callAt && G.ann) drawAnnGroup(...); else if (G._callAt && G.call) drawCallIcon(...);`
3. W trybie „na żywo” przy każdym nowym stanie: `G.call = callInfo(s); G.ann = annInfo(s);`
4. Po stronie aplikacji (C++/Qt) do obiektu stanu `s` trzeba dołożyć pola z tabeli niżej;
   dwa z nich są binarne i wymagają dekoderów z `dekodery_SOMA.cpp`.

## Wejście (pola stanu `s` → zmienne SOMA)

| Pole | Zmienna SOMA | Znaczenie |
|---|---|---|
| `conn` | — | `true` gdy jest połączenie z pojazdem |
| `ccStt` | `CntrlCntrVcCnnStt` | stan połączenia z CC: „Wählen…”, „Warten auf Annahme”, „Verbunden”, „Nicht…” |
| `ccKind` | `CntrlCntrVcCnnKnd` | rodzaj: „Sprechwunsch” (RTT), „Prio…” (PRTT), „Überfall” (CA), „Durchsage” (ogłoszenie CC), „Gespräch” (rozmowa / ogłoszenie na żywo) |
| `voice` | `Dat_Radio.VoiceConStatus` | kto mówi: 1 = kierowca, 2 = CC |
| `acstc` | `Dat_Acstc.AcousticState` | co gra i na jakie głośniki, tekst `"źródło:wyj,wyj;…"` |
| `acreq` | `Dat_Acstc.ActiveRequests` | ID aktywnych żądań akustycznych, tekst `"id,id"` |

### `Dat_Acstc.AcousticState` (typ SOMA 0x2C)

Blob: od bajtu 12 `[len u32][guid 16 B][dataLen u32][k u32]`, potem k razy
`[źródło u32][n u32][n × wyjście u32]`. Bezczynność = k = 0 (tekst pusty).

* **źródło**: 4 = ogłoszenie kierowcy / z bazy (także zapowiedź przystanku), 7 = głos CC
* **wyjście**: 1 = głośnik kierowcy, 3 = głośniki wewnętrzne, 5 = głośniki zewnętrzne

### `Dat_Acstc.ActiveRequests` (typ SOMA 0x2C)

Blob: od bajtu 12 `[len][guid 16 B][dataLen][k]`, potem k × `[id u32]`.

| ID | Żądanie |
|---|---|
| 0x0D (13) | ręczne ogłoszenie kierowcy (z bazy) |
| 0x0C (12) | komunikat tylko dla kierowcy (np. zapowiedź nr 9007) |
| 0x22 (34) | **automatyczna zapowiedź przystanku** |
| 0x07 (7) | głos z CC (rozmowa / Durchsage) |
| 0x05, 0x1D | inne sygnały CC/RTT widziane w logach |

Zapowiedź przystanku i ręczne ogłoszenie kierowcy mają **identyczny** `AcousticState`
(`4:3`) — rozróżnia je dopiero ID żądania 0x22.

## Wyjście: co pokazuje gra

### `G.ann` — tablica kluczy ikon ogłoszeń

| Klucz | Kiedy (SOMA) | Ikona w grze (jak na terminalu) | Podpis |
|---|---|---|---|
| `int` | źródło 4, wyjście 3 | biały krąg, zielony pojazd z białymi falami **w środku** | OGŁ. WEWN. |
| `ext` | źródło 4, wyjście 5 | pojazd z zielonymi falami **nad nim (lewy górny róg)** | OGŁ. ZEWN. |
| `both` | źródło 4, wyjścia 3+5 | fale w obu miejscach | OGŁ. WEWN.+ZEWN. |
| `stop` | źródło 4 + `ActiveRequests` zawiera 0x22 | **niebieski** krąg, biały głośnik z migającymi falami | ZAPOWIEDŹ PRZYSTANKU |
| `drv` | źródło 4, tylko wyjście 1 | jak `stop` (na terminalu: niebieski przycisk 🔊) | GŁOŚNIK KIEROWCY |
| `ccDrv` | „Durchsage” + „Verbunden”, źródło 7, wyjście 1 | słuchawka + „LS” | CC: KIEROWCA |
| `ccPass` | „Durchsage” + „Verbunden”, źródło 7, wyjście 3 | megafon + „LS” | CC: PASAŻEROWIE |

* Kilka ikon rysuje się obok siebie (co 20 px), np. CC do obu = megafon + słuchawka,
  podpis „CC: KIEROWCA + PASAŻEROWIE”. Podpis żółty (`#ffe27a`) nad ikonami.
* Ikony mają rozchodzący się pierścień i migające fale (animacja).
* Okno „Weisung – Durchsage verstanden?” (👍/👎) z terminala **celowo nie jest**
  odtwarzane w grze.

### `G.call` — połączenie głosowe z CC (`drawCallIcon`)

| Pole | Wartości |
|---|---|
| `kind` | `rtt` (słuchawka), `prtt` (migający czerwony trójkąt ⚠), `ca` (cyfra) |
| `phase` | `wait` (oczekiwanie: ikona podskakuje, fale) / `talk` (połączono: niebieski krąg) |
| `step` | CA w oczekiwaniu: 1 = wybieranie, 2 = oczekiwanie na przyjęcie |
| `tx` | `true` = mówi kierowca (strzałka na zewnątrz, „KIEROWCA”, CA: 3), `false` = mówi CC (strzałka do środka, „CC”, CA: 4) |

* Ogłoszenie na żywo dyspozytora („Gespräch” + Verbunden) pokazuje się jako zwykła
  rozmowa RTT (niebieska słuchawka ze strzałką do środka) — tak samo jak na terminalu.
* Gdy jednocześnie jest `G.ann` i `G.call`, `drawAnnGroup` rysuje ikonę połączenia jako ostatnią w rzędzie.

## Zrzuty (`zrzuty_terminala\`)

| Plik | Co pokazuje |
|---|---|
| `ikony_ogloszenia_wszystkie.png` | zestawienie wszystkich ikon z terminala z opisami |
| `icon_ann_all.png`, `icon_ann_int_vs_ext.png` | ogłoszenia kierowcy: wewn. / zewn. / oba |
| `icon_disp_all.png`, `icon_disp_drv_vs_pass.png` | ogłoszenia dyspozytora: do kierowcy (słuchawka LS) / pasażerów (megafon LS) / obu |
| `zapowiedz_przystanku_terminal.png` | terminal podczas zapowiedzi przystanku |
| `ikona_glosnika_w_grze.png` | podgląd ikony głośnika (`stop`/`drv`) narysowanej w grze |

Źródło: obserwacje na pojeździe testowym 192.168.10.2 (sniffer SOMA + VNC terminala),
10.11.2026. Kod referencyjny: repo `MWL_THT`, commit `9de0ff3`.
