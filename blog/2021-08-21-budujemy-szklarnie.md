---
title: "Budujemy szklarnię!"
date: 2021-08-21T12:00:00+02:00
updated: 2026-10-01
ai: written
lang: pl
image: ads_7918.jpeg
description: "Wiosną 2021 roku Hackerspace Pomorze zbudował własną szklarnię: kopuła z rurek ze złomu, folia, panel słoneczny, Raspberry Pi i telemetria przez APRS."
---

Wiosną 2021 roku, kiedy spejs dopiero budził się po pandemii, w Hackerspace Pomorze wyrosła szklarnia. Zaczęło się od wątku na forum, a skończyło na kopule z rurek ze złomu, w której rosły pomidory, a dane z czujników leciały przez radio.

## Pomysł

Pod koniec marca karo zaproponowała, żeby spejs miał własną hodowlę warzyw - na większą skalę niż parapet - i system monitoringu roślin na Arduino albo Raspberry Pi. Miejsce znalazło się na działce jednego z członków, a lista upraw obejmowała pomidory, cukinie, papryki, ogórki, dynie i zioła. Na jesień planowaliśmy spejsowe święto plonów.

Wątek szybko obrósł w pomysły: FarmBot, bramka LoRa, nawóz z pobliskiego hipodromu, a nawet czyjaś praca inżynierska o sterowaniu szklarnią. Najważniejsza okazała się jednak wiadomość, że w tuBazie po majówce powstaną geodomy pod uprawy.

## Kopuła z rurek

8 maja pojechaliśmy do [tuBazy i FabLabu Trójmiasto](/blog/zwiedzamy-tubaza-i-fablab-trojmiasto/). Ich geodom-szklarnia tak nas zainspirował, że już następnego dnia zaczęliśmy budować własny prototyp. Pierwszy dzień budowy nagrałem w formie timelapse'u:

<iframe src="https://www.youtube-nocookie.com/embed/qY4m3wcmOoo" title="Budujemy Szklarnię!" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Do skończenia konstrukcji zabrakło nam czterech rurek. Znalazłem je w starych łóżkach na złomie: kupiłem jeden bok łóżka i przewiozłem go rowerem critbita, z rurkami przywiązanymi wzdłuż ramy. Dojechałem cały, a na złomie zostało jeszcze materiału na drugą szklarnię.

![Boki starych łóżek z rurkami na złomie](IMG_20210511_142042.jpeg)

![Rurki przywiązane do roweru](IMG_20210511_143401.jpeg)

![Rower z rurkami po powrocie](IMG_20210511_144611.jpeg)

28 maja okryliśmy kopułę folią. Zaraz potem pojawiły się pierwsze pomidory, regał z IKEA od Jogurta i apel o niepotrzebne półki, europalety i deski. W środku było od razu o kilka stopni cieplej niż na zewnątrz - szklarnia robiła to, co do niej należało.

## Elektronika i radio

Latem szklarnia zamieniła się w poligon elektroniczny. 11 lipca karo z ekipą zamontowali panel słoneczny i Raspberry Pi. Dwa tygodnie później, przy pikniku na działce (na zdjęciu w nagłówku), przetestowaliśmy łączność radiową: pakiety APRS ze szklarni docierały bez problemu przy mocy 1 W.

Z tego wyjazdu wyszedł plan na dalszą pracę. Raspberry Pi miało wystawiać własną, ukrytą sieć WiFi i mieć awaryjne połączenie kablem, bo modem LTE przestał działać. Zamiast osobnego Arduino zdecydowaliśmy się na czujniki na NodeMCU, które łączą się z Raspberry przez WiFi, a Domoticz miał je konfigurować automatycznie. Telemetrię miał wysyłać direwolf, przez kabel audio do radia Baofeng UV-3R.

![Skrzynka z sensorami szklarni](IMG_20210804_215403.jpeg)

Na początku sierpnia SQ2WSZ i SQ2MTG złożyli skrzynkę z czujnikami, w tym z czujnikiem jakości powietrza Luftdaten. Na Raspberry Pi 3B+ działały już direwolf i Domoticz, całość zasilał akumulator przez przetwornice step-down, a skrypt czekał tylko na dane z czujników. Pod koniec sierpnia hamsterking pochwalił się szczepkami pomidorów, które w szklarni miały się świetnie.

To był jeden z tych projektów, w których każdy dołożył coś od siebie: ktoś działkę, ktoś rurki, ktoś półkę, ktoś radio.

## Więcej

- [Szklarnie spejsowe](https://forum.hsp.sh/t/szklarnie-spejsowe/179): cały wątek na forum, ze zdjęciami wszystkich uczestników.
- [Radiowa Środa](https://forum.hsp.sh/t/radiowa-sroda/359): spotkania z SP2GDZ, od których zaczęła się radiowa część projektu.
- [Pięć lat w Hackerspace Pomorze](/blog/piec-lat-w-hackerspace-pomorze/).

*Ten wpis podsumowuje wątek „Szklarnie spejsowe” na [forum Hackerspace Pomorze](https://forum.hsp.sh/t/szklarnie-spejsowe/179) z okresu od marca do sierpnia 2021 roku.*
