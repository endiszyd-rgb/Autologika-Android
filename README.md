# Autologika Android 0.20.0

## Nowe w 0.20.0

- profesjonalny, ciemny system wizualny z warstwowym tłem SVG, głębszymi panelami i wyraźniejszą hierarchią,
- animowane przyciski, wejścia elementów i dopracowana nawigacja boczna,
- przebudowany Workflow z polskimi nazwami etapów, licznikami, blokadami i opisanymi akcjami,
- naprawione kodowanie polskich znaków w całej aplikacji,
- automatyczny test chroniący interfejs przed ponownym pojawieniem się uszkodzonych tekstów.

## Nowe w 0.19.0

- wspólna, czytelna wyszukiwarka danych w mobilnych modułach warsztatu,
- wyszukiwanie klientów po nazwie, firmie, telefonie i adresie e-mail,
- wyszukiwanie pojazdów po rejestracji, VIN, marce, modelu i silniku,
- filtrowanie tablicy workflow bez utraty podziału na etapy,
- szybkie odnajdywanie zlecenia bezpośrednio w Centrum zlecenia,
- wyszukiwanie odporne na wielkość liter, polskie znaki, spacje i myślniki,
- liczniki widocznych wyników oraz przycisk czyszczenia filtra.

## Nowe w 0.18.0

- sprawdzanie najnowszej wersji bezpośrednio w `Ustawieniach`,
- bezpieczne porównywanie numerów wersji z najnowszym wydaniem GitHub,
- pobieranie właściwego pliku APK z widocznym postępem,
- kontrola kompletności pobranego instalatora przed uruchomieniem,
- otwieranie systemowego instalatora Android oraz szybkie przejście do zgody na instalację z tego źródła,
- informacje o wydaniu widoczne przed pobraniem aktualizacji.

## Nowe w 0.17.0

- przebudowane Centrum zlecenia z sześcioma czytelnymi zakładkami zamiast jednego długiego ekranu,
- pasek postępu prowadzący kolejno przez diagnozę, akceptację, części, zakres prac, czas, QC, płatność i wydanie,
- jedna konkretna podpowiedź następnego działania z bezpośrednim przejściem do właściwego modułu,
- podstawowa diagnoza jako krótki opis usterki oraz osobna, rozwijana diagnostyka elektroniczna,
- liczniki otwartych części, działającego timera, wartości, wpłat i czasu pracy na ekranie przeglądu,
- wydanie pojazdu dopiero po ukończeniu przebiegu i ustawieniu statusu `GOTOWE`,
- aktualne wersje poprawek Expo SDK 57.

## Nowe w 0.16.0

- moduł Finanse / KPI z obrotem, wpłatami, marżą i należnościami,
- edycja uzgodnionej ceny końcowej zlecenia z powodem korekty,
- wspólna cena końcowa dla salda i rentowności na PC oraz Androidzie,
- usuwanie błędnie dodanych płatności i części w Centrum zlecenia,
- bezpośrednie przejście z pozycji finansowej do właściwego zlecenia.

## Nowe w 0.15.2

- katalog prac zgodny z PC: 48 grup, 339 prac i 1063 warianty,
- dodatkowe szczegółowe pozycje diagnostyczne w każdej grupie,
- własne szablony zsynchronizowane z PC są dostępne w Centrum zlecenia,
- dodanie własnego szablonu przenosi cenę, czas, opis, procedurę, checklistę QC, części i materiały.

## Nowe w 0.15.0

- skan Zebra USB HID / DataWedge w magazynie uruchamia wyszukiwanie automatycznie po ostatniej cyfrze, bez naciskania Enter lub przycisku „Szukaj”,
- wyszukiwanie internetowe korzysta z dodatkowego źródła DuckDuckGo Lite i preferuje katalogi motoryzacyjne przed marketplace,
- dokładniejsze rozpoznawanie producenta i numeru katalogowego z tytułu oraz opisu wyniku,
- polskie nazwy popularnych części oraz oczyszczone listy pasujących pojazdów i numerów OE,
- kod `5901532528992` jest rozpoznawany jako TEKNOROT V-557 — łącznik stabilizatora.

## Poprawka 0.14.2

- Centrum zlecenia pokazuje dane z aktualnego rekordu pojazdu zamiast nieaktualnej kopii zapisanej w zleceniu,
- wybór zlecenia i nagłówek Centrum korzystają z tego samego mechanizmu rozpoznawania pojazdu co lista zleceń,
- powiązanie jest automatycznie naprawiane po VIN-ie lub numerze rejestracyjnym także po wejściu bezpośrednio do Centrum,
- identyfikatory przesłane jako liczba i tekst są traktowane jednakowo.

## Poprawka 0.14.1

- lista zleceń rozpoznaje przypisany pojazd po identyfikatorze, VIN-ie albo numerze rejestracyjnym,
- brakujące lub nieaktualne `vehicle_cloud_id` jest automatycznie naprawiane przy jednoznacznym dopasowaniu,
- dane pojazdu zapisane w zleceniu nie są już błędnie oznaczane jako „brak pojazdu”,
- wybór istniejącego pojazdu w nowym zleceniu odzyskuje poprawną pozycję po usunięciu lub synchronizacji wcześniejszego wyboru.

## Nowe w 0.14.0

- pełna edycja zapisanych kart magazynowych, w tym producenta, numerów OE, dopasowania, cen, lokalizacji i stanu,
- szybka korekta stanu przyciskami −1 i +1 bez otwierania formularza,
- usuwanie części jako synchronizowany tombstone,
- podsumowanie wartości magazynu oraz liczby pozycji z niskim stanem,
- zgodność z pojazdami i numery krzyżowe widoczne bezpośrednio na liście,
- walidacja kodu GTIN i wszystkich wartości liczbowych przed zapisem.

## Nowe w 0.12.0
- magazyn własny części zsynchronizowany z rekordami aplikacji PC,
- skanowanie EAN, UPC i GTIN przez Zebra USB HID / DataWedge oraz aparat,
- wyszukiwanie kolejno w magazynie, lokalnej pamięci, katalogach produktów i dokładnych wynikach WWW,
- automatyczne uzupełnianie nazwy, producenta, numeru katalogowego, opisu i strony źródłowej,
- lokalny cache trafień przez 180 dni i braku wyniku przez 24 godziny,
- możliwość otwarcia strony źródłowej przed zapisaniem części w magazynie.

## Poprawka 0.10.1
- marka i model z AZTEC są dopasowywane do katalogu niezależnie od wielkości liter,
- wartości spoza katalogu są zachowywane i wyświetlane jako pola ręczne.

## Nowe w 0.10
- nowe logo AutoLogika jako ikona aplikacji, znak w menu i ekran ładowania,
- dekoder kodu AZTEC z polskiego dowodu rejestracyjnego dla skanera Zebra,
- automatyczne uzupełnianie rejestracji, VIN-u, marki, modelu, roku, silnika, mocy i danych posiadacza,
- obsługa danych z USB HID / DataWedge oraz surowych bajtów Zebra CoreScanner/SNAPI,
- zachowanie surowego skanu do diagnostyki, jeśli dokumentu nie uda się odczytać.

Dekodowanie standardu dowodu korzysta z pakietu
[`polish-vehicle-registration-certificate-decoder`](https://github.com/dex4er/js-polish-vehicle-registration-certificate-decoder)
udostępnionego na licencji GPL-2.0.

## Nowe w 0.9
- edycja danych klientów i pojazdów bezpośrednio z list,
- walidacja adresu e-mail, VIN-u, roku, mocy i przebiegu,
- normalizacja numeru rejestracyjnego, VIN-u i kodu silnika,
- blokada duplikatów VIN i numerów rejestracyjnych,
- automatyczne odświeżanie danych klienta i pojazdu w powiązanych zleceniach.

## Nowe w 0.8
- usuwanie klientów z pełną kaskadą pojazdów, zleceń i załączników,
- osobne usuwanie pojazdów oraz aktywnych i archiwalnych zleceń,
- podgląd skutków przed trwałym usunięciem i synchronizowane tombstone,
- odbiór skanów Zebra przez USB HID / DataWedge,
- równoległe skanowanie aparatem kodów AZTEC, PDF417, QR, Code 128 i Code 39,
- lokalny zapis surowych payloadów do dalszego przygotowania dekodera dowodu rejestracyjnego.

Natywna aplikacja Android (React Native / Expo) dla tabletu. Offline-first: tablet ma własną SQLite, a rekordy i załączniki synchronizują się z Autologika Cloud / Supabase.

## Nowe w 0.7
- zakres naprawy z pełnym katalogiem 618 wariantów prac i procedurami zgodnymi z Desktop,
- własne pozycje naprawy bez opuszczania Centrum zlecenia,
- wspólne rozliczenie płatności, akceptacji i checklisty wydania,
- działający przycisk „Zamknij i oznacz jako wydane”,
- archiwum zakończonych zleceń z przywracaniem i trwałym usuwaniem danych zlecenia,
- tworzenie zlecenia dla istniejącego pojazdu albo wraz z nowym klientem i pojazdem,
- wersja aplikacji i Android `versionCode` przygotowane pod nowy APK.

## Nowe w 0.6
- pięć dokumentów Autologiki PDF dołączonych jako zasoby offline,
- otwieranie/udostępnianie PDF przez system Android,
- dokumentacja zdjęciowa zlecenia podzielona na: PRZYJĘCIE / DIAGNOZA / NAPRAWA / WYDANIE,
- usuwanie zdjęć jako tombstone synchronizowany z PC i chmurą,
- po synchronizacji usunięty załącznik jest również kasowany z prywatnego Storage,
- lokalny eksport awaryjnej kopii danych do JSON,
- poprawka błędu składni migracji SQLite z wcześniejszej wersji,
- zachowane: Workflow, terminarz, Centrum zlecenia, części, płatności, timer, aparat, VIN/AZTEC, podpis klienta i Auth/RLS.

## Uruchomienie developerskie
```bash
npm install
npx expo start
```

## APK przez EAS
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Lokalny APK 0.14.0
Gotowy plik instalacyjny znajduje się w `release/Autologika-Android-0.14.0.apk`.
Jest podpisany lokalnym kluczem deweloperskim i służy do bezpośredniej instalacji
na urządzeniu testowym. Publikacja w Google Play wymaga trwałego klucza wydawniczego.

Do ponownego lokalnego buildu użyj JDK 17, Android SDK 36 i polecenia:
```powershell
cd android
.\gradlew.bat assembleRelease
```

## Chmura
Używaj wyłącznie klucza anon/publishable oraz konta Supabase Auth. Nigdy nie umieszczaj `service_role` w APK. Bucket `order-files` pozostaje prywatny.

## Backup
Eksport JSON jest kopią awaryjną konkretnego tabletu. Nie zastępuje centralnej synchronizacji ani docelowego backupu chmury.


## Zmiany 0.6
- parytet zmian Desktop 0.20.1–0.20.4
- bezpieczniejsza konfiguracja Supabase: normalizacja URL, blokada sb_secret_, test połączenia, bez wyświetlania pełnego klucza
- Szybkie przyjęcie: kaskadowy katalog Marka → Model → Generacja → Rok → Silnik → Moc → Kod silnika
- ten sam katalog pojazdów co Desktop 0.20.4, z trybem ręcznym dla brakujących wariantów
- generation/year/engine/power_hp/engine_code zapisywane w pojeździe i zleceniu oraz synchronizowane przez sync_records


## Hotfix 0.6.2
- usunięto surowe węzły tekstowe/odstępy w JSX formularza Szybkie przyjęcie, które mogły powodować `Text strings must be rendered within a <Text> component`;
- `SafeAreaView` pochodzi teraz z `react-native-safe-area-context`;
- zabezpieczono warunkowe renderowanie `wait_state`, aby React Native nie dostał surowego stringa.
