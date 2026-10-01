# CV

The build makes the CV (`/cv/Marcin_Jasiukowicz_CV.pdf`) from this file and from `src/timeline.md`.
The CV has one page in English and one page in Polish.

The dates, the organizations and the places come from `src/timeline.md`.
This file adds the text that only the CV shows: the descriptions in English and in Polish, the skills and the contact data.

Each `##` heading is one part of the CV. Each `###` heading is one entry in that part.
The list below a heading sets the fields. A field that can occur more than one time makes a list.

Fields of an entry in `projects`, `work` and `education`:

- `from` (required, one or more): the title of an entry in `src/timeline.md`.
  The CV uses the earliest start date and the latest end date of these entries.
- `org-en`, `org-pl`: the organization. The default for `org-en` is the `###` heading. The default for `org-pl` is `org-en`.
- `role-en`, `role-pl`: the role. The default for `role-en` is the title of the first `from` entry.
- `place-en`, `place-pl`: the place. The default is the place of the first `from` entry.
- `en`, `pl` (one or more): one bullet point of the description.

Fields of an entry in `awards`:

- `from` (required): the title of an entry in `src/timeline.md`. The CV uses its date and its organization.
- `en`, `pl`: the name of the award. The default for `en` is the title of the `from` entry.
- `org-en`, `org-pl`: the organization. The default is the organization of the `from` entry.

The build makes two versions of the CV. The public version has no phone number. The site links to it.
The private version has the phone number. The site does not link to it. Its address is not in this repository.
The phone number and the file name of the private version come from the variables `CV_PHONE` and `CV_PRIVATE_NAME` (see README.md, "CV").
Do not write the phone number in this file. This repository is public.

In the `header` part, `summary-en` is the description on the card of the home page (`summary-pl` is for a Polish version). The home page card also shows the name, the tagline, the current job, the contact data and the profiles in `instagram`, `twitter` and `telegram`.

In the `header` part, `photo` and `background` are paths from the root of the repository.
The `photo` is the profile photo. The `background` is the image behind the name, with the proportions 210:44 (the width of an A4 page and the height of the header).
The background is a part of a photo of New Zealand that OPS-SAT took (`blog/2024-12-18-masters-thesis-ops-sat/ops-sat-new-zealand-original.png`).

The parts `skills`, `certificates`, `learning` and `languages` are lists of `en` and `pl` items.
Text outside the lists is ignored.

## header
- name: Marcin Jasiukowicz
- tagline-en: Tinkerer obsessed with space 🚀
- tagline-pl: Majsterkowicz zafascynowany kosmosem 🚀
- photo: src/static/assets/meirl.png
- background: src/static/assets/earth-header.jpg
- card-background: src/cv/earth-card.jpg
- email: contact@yasiu.pl
- website: yasiu.pl
- linkedin: yasiu
- github: yasiupl
- mastodon: @yasiu@0x3c.pl
- instagram: yasiu.pl
- twitter: yasiupl
- telegram: yasiupl
- summary-en: Mission Analyst at PIAP Space, plotting trajectories for RAVEN – the Polish in-space transportation vehicle built for ESA. Before that, I flew OPS-SAT from ESA's mission control in Darmstadt, sent a microbiology experiment to the edge of space on BEXUS 30, and led the SimLE science club through balloons and rockets. Board member of PSPA, glider pilot in training, and a hacker and maker at heart.
- summary-pl: Analityk misji w PIAP Space – projektuję trajektorie dla RAVEN, polskiego pojazdu do transportu orbitalnego budowanego dla ESA. Wcześniej sterowałem satelitą OPS-SAT z centrum kontroli misji ESA w Darmstadt, wysłałem eksperyment mikrobiologiczny na skraj kosmosu na balonie BEXUS 30 i prowadziłem koło naukowe SimLE przez balony i rakiety. Członek zarządu PSPA, szybownik w trakcie szkolenia, z duszy haker i maker.
- consent-en: I agree to the processing of personal data provided in this document for realizing the recruitment process.
- consent-pl: Wyrażam zgodę na przetwarzanie danych osobowych podanych w niniejszym dokumencie w celu realizacji procesu rekrutacyjnego.

## work

### PIAP Space
- from: Mission Analyst
- from: Junior Mission Analyst
- role-en: Mission Analyst, RAVEN Programme
- role-pl: Analityk Misji w Programie RAVEN
- place-pl: Warszawa, Polska
- en: Design and simulation of the trajectories for RAVEN DEMO-1, the first mission of the Polish in-space transportation vehicle developed for the European Space Agency.
- en: Requirements analysis, mission architecture, trade-off analyses of technical solutions, documentation, and cooperation with the consortium members and ESA.
- pl: Projektowanie i symulacja trajektorii misji RAVEN DEMO-1, pierwszej misji polskiego pojazdu do transportu orbitalnego rozwijanego na zlecenie Europejskiej Agencji Kosmicznej.
- pl: Analiza wymagań, architektura misji, analizy trade-off rozwiązań technologicznych, dokumentacja oraz współpraca z konsorcjantami i ESA.

### RADMOR S.A. (WB Group)
- from: Space Systems Specialist
- role-en: Specialist, Space Technology Center
- role-pl: Specjalista w Centrum Technologii Kosmicznych
- org-pl: RADMOR S.A. (Grupa WB)
- place-pl: Gdynia, Polska
- en: Technical analyses and research to support the strategic space initiatives of Poland.
- en: The goal of the WB Group Space Technology Center is the technological sovereignty of Poland in space, with a focus on observation and communication capabilities.
- pl: Analizy techniczne i badania wspierające strategiczne inicjatywy Polski w zakresie technologii kosmicznych.
- pl: Celem Centrum Technologii Kosmicznych Grupy WB jest technologiczna niezależność Polski w sektorze kosmicznym, ze szczególnym uwzględnieniem zdolności obserwacyjnych i komunikacyjnych.

### European Space Agency
- from: OPS-SAT Mission Control Engineer
- org-pl: Europejska Agencja Kosmiczna
- role-pl: Inżynier kontroli misji OPS-SAT
- place-pl: Darmstadt, Niemcy
- en: Member of the OPS-SAT Mission Control Team at ESOC, responsible for the operations and the health of the spacecraft.
- en: End-to-end solutions across the technology stack, from the on-board systems to the ground segment: electronics, firmware, software, telemetry, tracking and commanding.
- pl: Członek Zespołu Kontroli Misji OPS-SAT w ESOC, odpowiedzialny za operacje satelity i jego stan na orbicie.
- pl: Rozwiązywanie problemów w całym stosie technologii, od systemów pokładowych po segment naziemny: elektronika, oprogramowanie wbudowane, oprogramowanie, telemetria, śledzenie i komendowanie.

### Intel Corporation
- from: Cloud Software Engineer
- org-pl: Intel Polska
- role-pl: Inżynier oprogramowania chmurowego
- place-en: Gdańsk, Poland & Folsom, USA (remote)
- place-pl: Gdańsk, Polska i Folsom, USA (zdalnie)
- en: Development of the Cloud Edge architecture: workload tests with Docker, Ansible and Linux tools in an industrial laboratory.
- en: Heat profiling of Submer SmartPod server racks cooled with mineral oil, with measurements of their performance and efficiency.
- pl: Rozwój architektury Cloud Edge: testy obciążenia z użyciem Dockera, Ansible i narzędzi Linuksa w laboratorium przemysłowym.
- pl: Profilowanie cieplne szaf serwerowych Submer SmartPod chłodzonych olejem mineralnym, z pomiarami ich wydajności i efektywności.

## projects

### SimLE Science Club
- from: Member
- from: Technical Coordinator
- from: President
- role-en: President, Technical Coordinator
- role-pl: Prezes Zarządu, Koordynator Techniczny
- org-pl: Koło Naukowe SimLE
- place-pl: Gdańsk, Polska
- en: Technical coordination of the Stardust experiment in the REXUS/BEXUS programme of ESA, DLR and SNSA, flown on the BEXUS 30 stratospheric balloon.
- en: As President, management of the club of more than 100 students: business relations, promotion and finances.
- pl: Koordynacja techniczna eksperymentu Stardust w programie REXUS/BEXUS agencji ESA, DLR i SNSA, wyniesionego na balonie stratosferycznym BEXUS 30.
- pl: Jako Prezes kierowałem kołem liczącym ponad 100 studentów: relacje biznesowe, promocja i finanse.

### Rocket Watch
- from: Rocket Watch
- role-en: Full Stack Developer
- role-pl: Programista Full Stack
- en: One of the first websites to follow current, upcoming and past rocket launches, with live streams and news for the community of space fans.
- en: Experience in user expectations, marketing and user experience design, together with the technical reliability of the site.
- pl: Jedna z pierwszych stron do śledzenia bieżących, nadchodzących i historycznych startów rakiet, z transmisjami na żywo i wiadomościami dla społeczności fanów kosmosu.
- pl: Doświadczenie w spełnianiu oczekiwań użytkowników, marketingu i projektowaniu doświadczeń użytkownika, przy zachowaniu niezawodności technicznej strony.

## education

### Gdańsk University of Technology, Hochschule Bremen
- from: Master of Science – Space and Satellite Technologies
- from: Master of Science – Engineering and Management of Space Systems
- org-pl: Politechnika Gdańska, Hochschule Bremen
- role-en: Master of Science (double degree), Engineering and Management of Space Systems
- role-pl: Podwójny dyplom magisterski, Engineering and Management of Space Systems
- place-en: Gdańsk, Poland & Bremen, Germany
- place-pl: Gdańsk, Polska i Brema, Niemcy

### Gdańsk University of Technology
- from: Bachelor of Engineering – Automatic Control and Robotics
- org-pl: Politechnika Gdańska
- role-en: Bachelor of Engineering, Automatic Control and Robotics
- role-pl: Inżynier, Automatyka i Robotyka
- place-pl: Gdańsk, Polska

## awards

### "Dyplom Roku" – best master's thesis of 2024
- from: "Dyplom Roku" – best master's thesis of 2024
- org-pl: Politechnika Gdańska
- en: "Dyplom Roku" – best master's thesis of 2024 at the faculty
- pl: „Dyplom Roku” – najlepsza praca magisterska 2024 roku na wydziale

### Golden Badge of the Graduate
- from: Golden Badge of the Graduate
- org-pl: Politechnika Gdańska
- pl: Złota Odznaka Absolwenta Politechniki Gdańskiej

### POLSA President's Award, third degree
- from: POLSA President's Award, third degree
- org-pl: Polska Agencja Kosmiczna
- en: Polish Space Agency President's Award (3rd degree) for the engineering thesis
- pl: Nagroda Prezesa Polskiej Agencji Kosmicznej (III stopnia) za pracę inżynierską

### "Złote Lwiątko" – Student Scientist
- from: "Złote Lwiątko" – Student Scientist
- org-pl: Samorząd Studentów Politechniki Gdańskiej
- en: "Złote Lwiątko" – Student Scientist of the year
- pl: „Złote Lwiątko” – Student Naukowiec roku

## skills
- en: Project management
- pl: Zarządzanie projektami
- en: Systems engineering, mission analysis
- pl: Inżynieria systemów, analiza misji
- en: Spacecraft operations
- pl: Operacje satelitarne
- en: Presentations, international cooperation
- pl: Prezentacje, współpraca międzynarodowa
- en: C++, JavaScript, Python
- pl: C++, JavaScript, Python
- en: Linux, networking
- pl: Linux, infrastruktura sieciowa
- en: Electronics, KiCad
- pl: Elektronika, KiCad
- en: Amateur radio, Software Defined Radio, GNU Radio
- pl: Krótkofalarstwo, radio programowalne (SDR), GNU Radio

## certificates
- en: Class A amateur radio licence, callsign SP4EVA
- pl: Świadectwo radiooperatora klasy A, znak SP4EVA
- en: IPC-A-610 soldering
- pl: Lutowanie w standardzie IPC-A-610
- en: JavaScript, Autodesk Inventor
- pl: JavaScript, Autodesk Inventor
- en: Startup School One
- pl: Startup School One

## languages
- en: Polish – native
- pl: Polski – ojczysty
- en: English – C1
- pl: Angielski – C1

## learning
- en: Business management, FPGA, RISC-V, embedded systems, LoRa
- pl: Zarządzanie biznesem, układy FPGA, RISC-V, systemy wbudowane, LoRa
