# Android 0.31.0 — poprawki z listy

Zmiany przygotowano na podstawie przesłanego ZIP-a wersji 0.30.15. Dotyczą wyłącznie aplikacji Android. Kod nie został wysłany do GitHuba i paczka nie zawiera nowego APK.

| Punkt | Zmiana w kodzie |
| --- | --- |
| 1 | Szablony prac: bezpośredni skrót w głównej nawigacji, czytelne karty, wyszukiwanie, wybór grupy, rozwijane warianty z procedurą i QC, ładowanie kolejnych 20 prac oraz osobny widok własnych szablonów zsynchronizowanych z PC. |
| 3, 17 | Terminarz: nowy widok dnia, tygodnia i listy, pasek dni, filtr stanowiska, szczegóły po dotknięciu wizyty, osobne okno dodawania/edycji. Wizyty przez północ pojawiają się w obu dniach. Zapis ostrzega o zajętym stanowisku i wymaga zmiany godziny lub stanowiska. |
| 4 | Zlecenia jako kafelki: rejestracja, marka/model, właściciel, temat, status, data i wartość. Zmiana statusu po otwarciu zlecenia. |
| 5 | Centrum zlecenia otwierane z menu zaczyna od podglądu i wyboru zlecenia. Brak automatycznego otwierania pierwszego zlecenia. Przycisk powrotu do wszystkich zleceń. |
| 7 | Powiadomienie o dostępnych częściach po obu sposobach tworzenia zlecenia. Lista zgodnych kart magazynowych także w zakładce Części. |
| 8 | Bieżące części i archiwum również wewnątrz zlecenia. Zamontowane części znikają z bieżącej listy; historia i koszty pozostają. |
| 9 | Wybór zlecenia w diagnostyce pokazuje kafelki z pojazdem, rejestracją, właścicielem i tematem. |
| 10 | Płatności pokazują cel wpłaty oraz zakres prac, pojazd i zlecenie. |
| 13 | Automatyczne sprawdzanie aktualizacji przy uruchomieniu i powrocie do aplikacji; ograniczenie do jednej próby co 6 godzin podczas działania aplikacji. Przełącznik w Ustawieniach, domyślnie włączony. Niepowodzenie połączenia nie blokuje pracy. |
| 14 | Wymaga uwagi: osobna lista konkretnych zleceń i powodów. Nowe zlecenie bez zamówienia części, zaległość od dnia przyjęcia, blokada lub opóźniona dostawa. Odebrane części nie są zgłaszane jako opóźnione. Rytm warsztatu przeniesiony nad listę zleceń i przedstawiony w trzech grupach obciążenia. |
| 16 | Wyszukiwanie prac we wszystkich grupach podczas dodawania zakresu; wyszukiwarki także w listach wyboru prac, wariantów i szablonów. |
| 18 | Osobne zakładki QC naprawy i QC wydania. QC wydania jest ostatnią zakładką; kolejność przebiegu: QC naprawy → płatność → QC wydania → wydanie. |
| 19 | Formularze wyceny i akceptacji usunięte z QC. Akceptacja pozostaje w zakładce Wycena i akceptacja. |
| 20 | Kontrola pojazdu: zapis układu, wyniku, pomiarów, wagi usterki i stanu; edycja i oznaczanie jako naprawione. Dane wpływają na Vehicle Health Score i synchronizują się jako vehicle_findings. Poprawione łączenie diagnozy z identyfikatorami tekstowymi zleceń. |
| 21 | Oś czasu pokazuje wszystkie zlecenia/naprawy danego pojazdu, aktywne i zakończone. Prace są szczegółami wizyty, nie oddzielnymi zdarzeniami. |

## Uruchomienie na PC

1. Rozpakuj paczkę do osobnego katalogu. Jeżeli masz lokalne, niewysłane zmiany z PC, porównaj je z paczką przed zastąpieniem plików. Plik `.patch` zawiera różnice względem przekazanego ZIP-a.
2. Użyj Node 22 LTS lub Node 24. W PowerShell możesz używać `npm.cmd`.
3. `npm ci`
4. `npm run check:source`, następnie `npm test`
5. `npm run check:release-version -- 0.31.0`
6. `npx expo start` z odpowiednim development buildem Androida albo zbuduj APK: `cd android`, następnie `./gradlew assembleRelease` (PowerShell: `.\gradlew.bat assembleRelease`). Lokalny build wymaga skonfigurowanego JDK i Android SDK.

Do aktualizacji zainstalowanej aplikacji użyj tego samego klucza podpisującego co poprzednio. Wersja 0.31.0 ma Android versionCode 60. Workflow GitHuba jest przygotowany na tę wersję i ma jej notatkę wydania, ale nie został uruchomiony.

## Sprawdzenie na telefonie / tablecie

- Zlecenia i Centrum: sprawdź kafelki oraz brak zmiany statusu przed otwarciem zlecenia. Otwórz różne zlecenia i upewnij się, że części, płatności i notatki należą do właściwego zlecenia.
- Baza napraw: wyszukaj wariant, zmień grupę i rozwiń procedurę. W zakresie pracy wyszukaj pozycję z innej grupy, wybierz wariant i dodaj ją do zlecenia.
- Terminarz: przetestuj dzień, tydzień, listę, zmianę tygodnia, filtr stanowiska, edycję i usuwanie wizyty. Sprawdź wizytę przez północ i kolizję na tym samym stanowisku.
- Magazyn: karta z dodatnim stanem i polem „Pasuje do” zawierającym markę/model ma wywołać informację po przyjęciu. Dopasowanie wykorzystuje zapisane opisy kompatybilności; nie jest katalogiem OE/VIN.
- Części: zmień status na ZAMONTOWANE i sprawdź archiwum w module Części oraz w zleceniu.
- Płatności: sprawdź wyświetlanie celu wpłaty, także dla wcześniejszych wpłat bez notatki.
- QC: potwierdź osobno naprawę i wydanie. Sprawdź brak formularza akceptacji w obu zakładkach i kolejność po płatności. Zachowano dotychczasową możliwość wydania niekompletnego zlecenia po świadomym potwierdzeniu; wymagany jest status GOTOWE.
- Pojazd: dodaj usterkę hamulców, sprawdź spadek oceny, następnie oznacz ją jako naprawioną i sprawdź przywrócenie punktów.
- Historia: dla auta z kilkoma wizytami sprawdź, czy każda naprawa występuje tylko raz i można ją otworzyć.
- Aktualizacje: przetestuj nowe wydanie GitHuba zawierające APK, tryb offline i wyłączenie powiadomień w Ustawieniach.
- Synchronizacja: sprawdź zapisy kontroli pojazdu i obu QC na PC po synchronizacji. Kod wersji PC nie został zmieniony.

## Weryfikacja w środowisku roboczym

116 testów logiki przeszło. Sprawdzono składnię JSX i renderowanie nowych komponentów przy szerokości 390 i 800 px w symulacji komponentów React Native, w tym zapis QC i kontroli pojazdu. Nie wykonano kompilacji APK ani testu na emulatorze/urządzeniu: brak Android SDK i zależności Expo w środowisku. Pogląd HTML wykorzystuje dane przykładowe i nie zastępuje testu Androida.
