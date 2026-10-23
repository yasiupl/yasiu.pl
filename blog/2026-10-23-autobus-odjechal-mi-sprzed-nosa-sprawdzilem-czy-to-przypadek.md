---
title: "Autobus odjechał mi sprzed nosa. Sprawdziłem, czy to przypadek"
date: 2026-10-23T14:26:18+02:00
ai: edited
lang: pl
description: "W co drugim pociągu autobus ZKM odjeżdża spod dworca w Iławie, zanim podróżni dojdą na przystanek. Sprawdziłem rozkłady i przygotowałem propozycję zmian."
image: https://forum.14-200.pl/uploads/default/original/1X/9607bb2bcaf1877eef00321a1799b672a0006d47.jpeg
---

Jeżeli podróżujesz koleją, być może znasz ten widok. Rano sprawdzam rozkład autobusów, żeby dostać się na dworzec i złapać pociąg do Warszawy albo Trójmiasta. Autobusem się nie da: przyjeżdża albo pół godziny wcześniej, albo chwilę przed odjazdem pociągu. Biorę więc taksówkę. Wieczorem, kiedy wracam z metropolii, sytuacja się odwraca: wychodzę z dworca na przystanek, a autobus odjeżdża mi sprzed nosa.

Na początku myślałem, że mi się wydaje. Może to przez opóźnienia PKP, które nie słyną z punktualności. Dlatego postanowiłem zaprząc najnowsze zdobycze naszej cywilizacji do zbadania tego tematu: rozkład ZKM, rozkład kolejowy i rzeczywiste godziny przyjazdów pociągów.

### Co udało się ustalić

**Wrażenie jest prawdziwe.** Według rozkładu, w dzień roboczy przy co drugim pociągu (50%) autobus ZKM odjeżdża spod dworca w chwili, gdy podróżni idą jeszcze z peronu na przystanek Dworcowa. Kilkadziesiąt razy dziennie następny autobus tej samej linii jest dopiero za pół godziny lub później.

Przykład z jednego wieczoru: o 21:02 przyjeżdża EIP z Krakowa, minutę później pociąg regionalny z Olsztyna, a o 21:06 TLK z Gdyni. „Jedynka” odjeżdża o 21:05, a „dwójka” o 21:06, zanim podróżni dojdą z peronu. Następna „jedynka” jest o 22:43, następna „dwójka” o 22:20.

Rano jest odwrotnie: autobusy przywożą na dworzec zwykle 20–35 minut przed pociągiem.

**To nie jest złośliwość.** Rozkład autobusów ułożony losowo daje podobny wynik (47%). Autobusy nie „uciekają” celowo. Problem jest inny: rozkłady ZKM i PKP nie są ze sobą uzgodnione.

W mojej opinii celem autobusów miejskich jest publiczna usługa przewozu pasażerów. Nie chodzi o stracone pieniądze z biletów, tylko o to, że autobus „wozi powietrze” w chwili, gdy kilka minut czekania pozwoliłoby zabrać podróżnych z pociągu.

Ironii dodaje fakt, że kampania miasta „Iława Inspiruje” wprost chwali się dobrym skomunikowaniem z metropoliami: godzina do Trójmiasta, półtorej do Warszawy, cztery do Krakowa. To świetna cecha Iławy. Co jednak z niej zostaje, jeżeli mieszkaniec nie może łatwo dostać się na dworzec, a turysta dojechać z niego do hotelu czy ośrodka wypoczynkowego?

### Co można zrobić

Sama identyfikacja problemu nie wystarczy. Jako obywatel zastanawiam się, co mogę z tym zrobić. Dlatego przygotowałem raport i propozycję zmian w rozkładzie jazdy:

- **Przesunięcie 51 ze 188 kursów w dzień roboczy, najwyżej o 5 minut.** Bez nowych autobusów i kierowców, z zachowaniem przerw kierowców i liczby autobusów.
- **Dogodnych przesiadek (do 5 minut czekania) jest 84 → 130 dziennie (+56%),** a autobusów, które „uciekają” pociągom, 34 → 13.
- **Zmiany można wprowadzać etapami.** Już pierwsze 20 zmian daje +23% dogodnych przesiadek.
- **Przy rzeczywistych godzinach pociągów zysk jest mniejszy, ale wciąż wyraźny:** od +19% do +34%, bo pociągi Intercity często się spóźniają.

Obiegi autobusów i służby kierowców odtworzyłem z rozkładu, bo ZKM ich nie publikuje. Każdą zmianę powinien więc sprawdzić dyspozytor ZKM.

👉 **Raport z mapą i propozycją zmian: [Autobus a pociąg: przesiadki na stacji Iława Główna](https://14-200.pl/@yasiu/2026-09-30-raport-zkm/)**

### Pytania, które zostają

1. **Według jakich zasad ZKM układa rozkład?** Nie są nigdzie opublikowane. Z analizy wynika trop: obecny rozkład ZKM, ważny od 1 września, lepiej pasuje do pociągów Intercity sprzed korekty rozkładu PKP z 30 sierpnia niż do tych, które jeżdżą teraz.
2. **Co po 13 grudnia?** Wtedy zaczyna obowiązywać nowy rozkład kolejowy. Z Iławy pojedzie między innymi 14 zamiast 12 par pociągów EIP do Warszawy i Trójmiasta. Jakie kryteria przyjmie ZKM, żeby nowy rozkład autobusów pasował do pociągów?
3. **Dlaczego rozkład ZKM nie jest dostępny w otwartym formacie?** Mam na myśli na przykład format GTFS, z którego korzystają aplikacje do planowania podróży, takie jak Google Maps czy Jakdojade. Źle pokazany autobus jest gorszy niż brak informacji: czekamy na niego, zamiast od razu zamówić taksówkę. Na potrzeby analizy przygotowałem nieoficjalny rozkład ZKM w formacie GTFS. Jest do pobrania razem z raportem.

Kod analizy i dane udostępniam otwarcie, każdy może sprawdzić wyniki: [yasiupl/analiza-zkm-ilawa na GitHubie](https://github.com/yasiupl/analiza-zkm-ilawa).

Zapraszam do dyskusji. Czy Wy też spotkaliście się z „uciekającymi autobusami”?

*Ten wpis ukazał się pierwotnie na [forum 14-200.pl](https://forum.14-200.pl/t/autobus-odjechal-mi-sprzed-nosa-sprawdzilem-czy-to-przypadek/206), gdzie toczy się dyskusja.*
