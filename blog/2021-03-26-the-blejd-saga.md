---
title: "The Blejd Saga, czyli czemu DevOps'owi jest [nie]potrzebna lutownica"
date: 2021-03-26T18:00:00+01:00
updated: 2026-09-30
ai: written
lang: pl
image: blejdy-na-biurku.jpg
description: "Jak w 2021 roku przywieźliśmy z Warszawy obudowę blade Dell PowerEdge M1000e z 16 serwerami, uruchomiliśmy ją w Hackerspace Pomorze i przygotowaliśmy do kolokacji."
---

Spisana wersja mojej prezentacji o tym, jak do Hackerspace Pomorze trafiła obudowa blade Dell PowerEdge M1000e. Slajdy są na końcu wpisu.

## Inspiracja: "The Mainframe Kid"

Wszystko zaczęło się od wystąpienia *"Here is what happens when an 18 year old buys a mainframe"* z 2016 roku. Jego bohater kupił mainframe IBM Z890 z 2004 roku.

<iframe src="https://www.youtube-nocookie.com/embed/Bf9pHr7svNs" title="Here is what happens when an 18 year old buys a mainframe" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## The story begins...

* **~2020:** Hackerspace Warszawa oferuje usługi serwerowe "na blejdach".
* **Jesień 2020:** Na forum HS Łódź pojawia się informacja o serwerze od HS Waw.
* **2021:** Ja nie chcę być gorszy, też chcę "serwer".

## Co to ma w środku?

* 16x Dell PowerEdge M610
* 2x Dell PowerConnect M6220
* 4x zasilacze 2360 W

Jakie to jest wielkie? Nie aż tak duże. Ile to waży? Dużo. Ile to ciągnie prądu? Oj, jeszcze więcej...

![Szafa rackowa w Hackerspace Pomorze](szafa-w-hsp.jpg)

## Pierwsze uruchomienia

* Montaż
* Podłączenie do zasilania
* Aktualizacja oprogramowania...
* Rozwiązanie zarządzania zdalnego
* Zamontowanie w kolokacji

![Obudowa blade na biurku, podłączona do laptopa](montaz.jpg)

## Problem: komunikacja RS232

Urządzenie jest zablokowane - switch, karta zarządzająca wymagają zmiany hasła. Zworka na płycie CMC (Chassis Management Controller) pozwala na reset hasła panelu sterowania, jednak reset głębszych konfiguracji wymaga wejścia przez interfejs RS232.

![Praca przy starym laptopie z kablami RS232](wiecej-starego-sprzetu.jpg)


Jak się okazuje, to nie tylko błędnie ustawiony Baud-rate, ale elektryczna niekompatybilność współczesnych konwerterów USB-TTL, które pracują w zakresie napięć +/- 5 V. Prawidłowy sygnał RS232 ma +/- 12 V, a działający zakres łapie się od 8 do 15 V - powyżej 5 V, które oferuje zwykły konwerter.

![Sygnał RS232 i nieczytelne znaki w terminalu](rs232-terminal.jpg)


## Rozwiązanie: więcej starego sprzętu!

Oto wszystkie moje próby stworzenia kompatybilnego konwertera. Co ciekawe złącze RS232 w m1000e ma kształt zwykłego złącza USB, także konwerter wygląda komicznie - z USB na USB, ale w protokole RS232.

![Adaptery i kable RS232](adaptery-rs232.jpg)

Ostatecznie znalazłem starą płytę główną, która miała sprzętowo zaimplementowany interfejs komunikacyjny.

![Przebieg sygnału RS232 na oscyloskopie](rs232-oscyloskop.jpg)

To jest momen w którym odkryłem, że w pełni załadowanego Blade Chassis nie można przesunąć po podłodze - waży ponad 200 kg. Dlatego urządzenia musiałem spiąć na przykład "dotyku boga".

![Obudowa blade z serwerami na podłodze](chassis-na-podlodze.jpg)

## Sukces! Co teraz?

* Reset ustawień switcha
* Aktualizacja oprogramowania
* Gotowi do wrzucenia do kolokacji?

![Boot menu switcha PowerConnect](switch-boot-menu.jpg)

![Obudowa blade z serwerami](gotowe-do-kolokacji.jpg)

## Zarządzanie zdalne!

Zanim zostawimy urzadzenie samemu sobie, musimy zabezpieczyć możliwość zarządzania zdalnego. Nietrywialne jest połączenie z urządzeniem z 2009 roku. Wygasłe certyfikaty, nieaktualne szyfry i stare technologie jak Java Webstart do uruchomienia KVM to tylko czubek góry lodowej. Ostatecznie skorzystałem i napisałem z wielu własnych skryptów bashowych, które automatyzują zarządzanie chassis - logowanie, zmiana ustawień, uruchomienie KVM:

* <https://github.com/yasiupl/bootleg-idrac6-client>
* <https://github.com/Informatic/idrac-kvmclient>

![Chassis Management Controller obudowy ARGO](chassis-management-controller.jpg)

Aby wyabstrachować wiele problemów, jako pierwszą usługę zainstalowaliśmy Proxmoxa.

![Proxmox VE na blade01](proxmox-blade01.jpg)

Ostatecznie urządzenie zostało ujarzmione i pozwalało na kontrolę zdalną. Tutaj sekwencja urochomienia w akompaniamencie muzycznym:

<video controls preload="metadata" src="VID_20210217_012509.mp4" title="m1000e odpowiada na komendy zdalne i uruchamia blejdy" allow="picture-in-picture"></video>
[m1000e odpowiada na komendy zdalne i uruchamia blejdy](VID_20210217_012509.mp4)

## Teraz kolokacja

Blejdy ostatecznie znalazły się w kolokacji, dzięku uprzejmości kolegów z SKOS.

![Serwery blade na tylnym siedzeniu samochodu](przeprowadzka-blejdy.jpg)

![Obudowa blade w bagażniku](przeprowadzka-chassis.jpg)

W trakcie przeprowadzki wygięło się kilka pinów łączących jednego blejda z chassis, jednak precyzyjna praca z śrubokrętem pozwoliła na jego naprawę. Ostatecznie maszyna została uruchomiona - napój dla skali.

![Obudowa blade z laptopem](demo.jpg)

## The End

Podziękowania dla q3k i pioter z hackerspace.pl oraz iwana i yakuba z hsp.sh.

Slajdy: [The Blejd Saga (PDF, 3,8 MB)](the-blejd-saga.pdf) oraz [oryginał w Google Slides](https://docs.google.com/presentation/d/1P9gY_Eas0cUIjEtn1D56So8dOurK82lwpvX05hsM_Xc/edit?usp=sharing).
