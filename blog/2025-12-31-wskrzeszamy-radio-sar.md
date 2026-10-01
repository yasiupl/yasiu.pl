---
title: "Wskrzeszamy Radio SAR"
date: 2025-12-31T09:17:59+01:00
updated: 2026-09-30
ai: written
lang: pl
image: IMG_20211109_172248.jpeg
description: "Jak przywróciliśmy do życia transmisję Radia SAR na Politechnice Gdańskiej: AzuraCast, zapasowy serwer Icecast, dokumentacja dla następców i wreszcie NAS na bibliotekę muzyki."
---

Chciałem podzielić się moją przygodą we wskrzeszaniu transmisji Radia SAR na Politechnice Gdańskiej. Opisywałem ją na bieżąco w [wątku na forum Hackerspace Pomorze](https://forum.hsp.sh/t/wskrzeszamy-radio-sar/822), a ten wpis zbiera całość w jednym miejscu - od pierwszego pomysłu, przez nową architekturę, aż po NAS, który trafił do studia pod koniec 2025 roku.

![Logo Radio SAR](57wEfgwkIFaFEzuOLyRjPgSadZo.png)

Radio SAR - [Studencka Agencja Radiowa](https://pl.wikipedia.org/wiki/Studencka_Agencja_Radiowa), to organizacja studencka na Politechnice Gdańskiej działająca od 1957 roku. Oryginalnie zajmowała się działalnością kulturalno-dziennikarską oraz propagandową. W latach 90’ chwilowo na falach radiowych jako [Radio ARnet](https://pl.wikipedia.org/wiki/Radio_ARnet). W 2003 roku organizacja została wskrzeszona w postaci radia internetowego - Radio SAR.

Poniżej kilka linków z zasobami archiwalnymi:

1. [Archiwum 65 lecia SAR.](https://sarchiwum.pl/)
2. [Strona upamiętniająca historię SAR z czasu otwarcia Radia SAR.](https://web.archive.org/web/20170806164537/http://www.pg.gda.pl/~sarold/htm/sar.htm)
3. [Archiwum SAR w Bibliotece PG.](https://pbc.gda.pl/dlibra/collectiondescription/50)

## Problem

Stacja po latach wciąż cieszy się zainteresowaniem studentów, a co roku dołączają nowe osoby zainteresowane prowadzeniem swoich audycji. Nie da się ukryć, że rola radia, a szczególnie radia internetowego przemija z czasem. W pierwszych latach działalności radio było szalenie popularne, nadając w ramach sieci SKOS ([20 Urodziny SKOS! Relacja](https://forum.hsp.sh/t/20-urodziny-skos-relacja/259)). W ostatnich latach, szczególnie po pandemii, radio upada od strony technicznej - zarówno wyposażenia studia, ale też części informatycznej.

Problemy z stabilnością sieci i komputerów znajdujących się w studiu sprawiły, że w ostatnich latach transmisja radia potrafiła być nieaktywna przez tygodnie.

Aby dać organizacji jak najlepszą szansę na wskrzeszenie się i odnalezienie swojego nowego ja, chciałem od dłuższego czasu zająć się aspektem technicznym. W wakacje 2024 roku znalazłem ten czas, odrywając myśli od innych aktywności.

## Infrastruktura nadawcza

W ostatnich latach architektura radia była bardzo prosta. Na jednym z komputerów w reżyserce był uruchomiony serwer [Icecast](http://icecast.org/), do którego łączono się oprogramowaniem [BUTT](https://danielnoethen.de/butt/) z innego urządzenia prowadzącego stałą transmisję. Na tym komputerze było uruchomione oprogramowanie AutoDJ grające ciągle muzykę, a w trakcie audycji można było przejść na strumień wychodzący z konsolety. Infrastruktury audio nie jestem w stanie opisać, bo nie mam w tym doświadczenia.

Wyglądało to mniej-więcej tak:

![Stara architektura Radia SAR](RadioSAR.old.png)

Prosto i działało przez większość czasu. Główny mankament tego rozwiązania jest taki, że kilka urządzeń musi pracować ciągle aby utrzymać transmisję. Lokalizacja nie pomagała, ponieważ w losowych momentach w akademiku potrafił być zresetowany prąd. UPS by nie pomógł, bo siadała też sieć SKOS. Zdarzyło się też, że konfiguracja SKOS była skopana i przez tygodnie nie było dostępu do internetu.

## Zróbmy coś lepszego

Przede wszystkim chcemy wynieść się z piwnicy w Domu Studenckim nr 2. Fajnie by było mieć lokalizację poza akademikiem z której będzie prowadzona transmisja. Z tego powodu poprosiliśmy Centrum Usług Informatycznych PG o przyznanie Radiu jakiegoś małego VPSa na którym można by postawić serwer Icecast. Zapytanie wysłaliśmy w marcu 2023 i… proces został zamknięty dopiero w lipcu 2024.

Serwer dźwięku to jedna rzecz, drugim aspektem jest utrzymanie ciągłości strumienia dźwięku. Rozwiązanie z ciągłym połączeniem BUTTa jest ok, ale pozostawia wiele do życzenia w kwestii zarządzania zdalnego. Bez obecności w reżyserce zmiana utworów musi być prowadzona przez RDP czy innego Team Viewera. Słabo. W przypadku gdy chcemy przenieść transmisję np. w teren, transmisja musi być przerwana, i połączona z innego miejsca, co też powoduje rozłączenie słuchaczy w ich odtwarzaczach.

Aby to poprawić, chcemy wprowadzić jakąś formę cyfrowego mixowania dźwięku, nomen omen AutoDJ, działającego po stronie “serwera”, tak aby połączenie z reżyserki było odciążone i wymagane tylko kiedy chcemy poprowadzić audycję.

Pierwotnie miało być zastosowane rozwiązanie [LibreTime](https://libretime.org/), które jest forkiem profesjonalnego oprogramowania [AirTime](https://www.sourcefabric.org/software/airtime). Okazało się jednak straszne w utrzymaniu, a instalacja zawiła.

Alternatywą jest [AzuraCast](https://www.azuracast.com/) - o wiele prostsze w instalacji i zarządzaniu, a nawet posiadające więcej funkcji.

Obydwa rozwiązania pozwalają na wirtualne zarządzanie stacją radiową. Usługa wybiera utwory z playlist, uruchamia jingle, odtwarza powtórki programów zgodnie z harmonogramem etc. Kiedy przychodzi czas transmisji z reżyserki, oprogramowanie akceptuje połączenie i przekierowuje dźwięk bez przerywania strumienia słuchaczy. Sercem implementującym tą funkcjonalność jest [Liquidsoap](https://www.liquidsoap.info/), język pozwalający na programistyczne definiowanie strumieni audio i video. Instancja Azuracast posiada również swoją instancję Icecasta, który może być traktowany jako backup.

Azuracast zostało zainstalowane na jednym z komputerów w radiu i przejęło rolę głównego urządzenia nadającego. Sygnał dźwiękowy z Azuracast jest przekierowany do zewnętrznego serwera Icecast, do którego łączą się użytkownicy. W przypadku gdy połączenie z Azuracast jest zerwane, serwer Icecast został skonfigurowany do odtwarzania sygnału zastępczego - powtarzającego się [jingla radia](https://stream.radiosar.pl/fallback.mp3).

Idealnie byłoby, gdyby cała instalacja Azuracast znajdowała się w “chmurze”, jednak dostępna przestrzeń dyskowa na VPSie nie pozwala na jej efektywne wykorzystanie - CUI bardzo skąpi, mamy mniej niż 10 GB. Bez możliwości trzymania utworów muzycznych na tej samej maszynie nie da się zmiksować sensownego sygnału.

Ostatecznie architektura prezentuje się następująco:

![Nowa architektura Radia SAR](RadioSAR.new.png)

W tym układzie, połączenie z reżyserki jest opcjonalne. Cały sygnał stacji jest miksowany na jednej maszynie i replikowany na zewnętrznym serwerze Icecast. W przypadku awarii, reżyserka wciąż może połączyć się do zewnętrznego serwera Icecast, który w międzyczasie będzie grał dźwięk zastępczy. Serwery dostały imiona po pionierach radia: **Tesla** to maszyna z Azuracast w studiu, a **Marconi** to VPS z drugim Icecastem w CUI PG.

Strumienie przechodzą przez Cloudflare Tunnel. Oryginalnie było to podyktowane brakiem możliwości otworzenia właściwych portów w firewallu SKOS. Jako bonus, serwer z którego nadajemy może być mobilny - gdziekolwiek wepniemy go do internetu, połączy się z Cloudflare i rozpocznie transmisję. Przy okazji strumień radia jest zgłaszany do publicznych katalogów stacji internetowych ([dir.xiph.org](https://dir.xiph.org/search?q=Radio+SAR), [internet-radio.com](https://www.internet-radio.com/search/?radio=Radio+SAR), [radio-browser.info](https://www.radio-browser.info/)), więc słuchacze mogą na nas trafić - chociażby przypadkiem.

## Efekt końcowy

<https://radiosar.pl>

* [play.radiosar.pl](https://play.radiosar.pl) - Strona publiczna odtwarzacza radia internetowego Azuracast.
* [play.radiosar.pl/podcasts](https://play.radiosar.pl/podcasts) - Podcasty/Audycje do odsłuchania poza anteną.
* [play.radiosar.pl/schedule](https://play.radiosar.pl/schedule) - Ramówka radia.

## Dokumentacja dla kolejnych pokoleń

Postawić serwer to jedno. W organizacji studenckiej trudniejsze jest przekazanie go dalej - administratorzy kończą studia, a wiedza znika razem z nimi. Dlatego całą konfigurację serwerów i usług spisałem w repozytorium Git organizacji Radia SAR na GitHubie:

* Każda usługa - Azuracast, Icecast, NGINX, Cloudflare i menadżer haseł [Vaultwarden](https://github.com/dani-garcia/vaultwarden) - ma swój opis w pliku README: do czego służy, jak jest skonfigurowana i jak z niej korzystać.
* Konfiguracje "produkcyjne" są kopiowane z serwerów do repozytorium skryptem, więc repozytorium podąża za zmianami na maszynach.
* Z plików README generują się instrukcje w PDF, gotowe do wydruku i przekazania osobom spoza ekipy technicznej.
* Hasła do usług przeniosłem do menadżera haseł hostowanego na serwerze radia, a do dostępu zdalnego służy VPN [Tailscale](https://tailscale.com/) - urządzenia widzą się nawzajem nawet wtedy, gdy standardowe metody komunikacji są zablokowane.
* W Azuracast każda audycja może mieć osobne konto do nadawania i swój slot w ramówce. Nagrania audycji trafiają do modułu Podcasty i można ich posłuchać poza anteną.

Repozytorium pozostaje prywatne, bo zawiera dane dostępowe. Najważniejsze, żeby dostępy zostały przekazane kolejnemu pokoleniu administratorów Radia SAR 🙂


## ToDo odhaczone: NAS

W pierwszej wersji tego opisu zostawiłem sobie zadanie na przyszłość:

> Architektura cały czas ma wąskie gardło - instancja Azuracast znajduje się na jednej maszynie, która nie posiada nawet redundancji dysków. Mam nadzieję, że dzięki zakupom sprzętu uda się kupić coś na pokrój serwera NAS do trzymania utworów muzycznych i archiwum nagrań.

Stało się: wraz z Wojtke jeszcze przed świętami 2025 udało się nam przenieść główną bibliotekę muzyki na dysk NAS, który Politechnika Gdańska łaskawie dostarczyła w tym roku (proces rozpoczęty w 2023 roku, zakończony w 2025 🙂).

Zdjęcia NASa brak, ale przy okazji odwiedziliśmy z karo, czarasem i niko serwerownię SKOS!

![](AGC_20251213_212201693.jpeg)


## Studio

Tak wyglądało studio Radia SAR w listopadzie 2021 roku:

![](IMG_20211109_172350.jpeg)

*Ten wpis zbiera i uzupełnia moje wpisy z [wątku na forum Hackerspace Pomorze](https://forum.hsp.sh/t/wskrzeszamy-radio-sar/822).*
