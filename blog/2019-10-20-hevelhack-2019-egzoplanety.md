---
title: "HevelHack 2019: znajdź swoją planetę"
date: 2019-10-20T20:38:00+02:00
updated: 2026-10-01
ai: written
lang: pl
image: hevelhack-2019.jpg
description: "Hackathon w Centrum Hevelianum: przez noc zbudowaliśmy z ekipą Hackerspace Trójmiasto wizualizację egzoplanet na wystawę - z kalkulatorem ekosfery i trójwymiarowymi planetami."
---

W październiku 2019 roku pojechaliśmy z ekipą Hackerspace Trójmiasto na hackathon do Centrum Hevelianum w Gdańsku, organizowany przez inkubator Starter. Zadanie nazywało się „Znajdź swoją planetę!”: przygotować interaktywną wizualizację planet pozasłonecznych na wystawę w Hevelianum.

## Egzoplanety

Organizatorzy przygotowali dla nas krótkie wprowadzenie. Pierwsze egzoplanety odkrył Aleksander Wolszczan w 1992 roku - trzy planety wokół pulsara PSR 1257+12. W 2019 roku potwierdzonych egzoplanet było już ponad 4100, w tym Proxima b, skalista planeta w ekosferze najbliższej nam gwiazdy. Zadanie: pokazać odwiedzającym, jak różnorodne są te światy i jak wiele z nich może przypominać Ziemię.

## Co zbudowaliśmy

Przez sobotę i noc z 19 na 20 października zbudowaliśmy aplikację „Egzoplanety w Hevelianum” z dwoma trybami:

- **Szukaj**: przeglądarka katalogu znanych egzoplanet, z danymi o planecie i jej gwieździe.
- **Buduj**: zaprojektuj własną planetę i sprawdź, czy mogłoby na niej istnieć życie.

Backend w Pythonie (Flask) liczył ekosferę gwiazdy - zakres odległości, w którym woda może być ciekła - z masy i temperatury gwiazdy, a także średnią temperaturę planety. Do grupowania planet z katalogu użyliśmy algorytmów klastrowania ze scikit-learn. Frontend rysował planety w WebGL, z własnymi shaderami, i działał jako aplikacja webowa z service workerem.

Historia commitów dobrze oddaje klimat hackathonu: od pierwszego commita w sobotę rano, przez wersję 0.0.5 późnym wieczorem i 0.1.0 o trzeciej nad ranem, do wersji 1.2.0 w niedzielę wieczorem. W zespole był m.in. not7cd, z którym rok później zakładaliśmy Hackerspace Pomorze.

## Więcej

- [Kod projektu na GitHubie](https://github.com/hspsh/hevelhack-2019), dziś w organizacji Hackerspace Pomorze.
- [Centrum Hevelianum](https://hevelianum.pl/).
- [Pięć lat w Hackerspace Pomorze](/blog/piec-lat-w-hackerspace-pomorze/).
- [NASA Space Apps Challenge Gdańsk 2018](/blog/nasa-space-apps-challenge-gdansk-2018/): mój poprzedni hackathon.
