/* js/crew.js — CREW Contact & Database (RAM / BBJ / B737)
   Annuaire complet, calcul automatique de POSIT (ARA/DDA/MRA/MMA),
   importation de fichiers CSV (Crew Info et Contacts), modification et suppression. */

(function() {
    const STORAGE_KEY = 'bbj_crew';
    const API_URL = '/api/data?file=crew';

    const DEFAULT_CREW = [
    {
        "matricule": "9402",
        "nom": "ASSELLALOU AHMED",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "27/07/1968",
        "cin": "XA10907",
        "other_qual": "AR, MP, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661233427",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "9410",
        "nom": "EL ATIAOUI ABDELMAJID",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "24/12/1972",
        "cin": "S256057",
        "other_qual": "AR, MP, TRE",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661141159 / 0537717595",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "9997",
        "nom": "LEAMARI ZAKARIA",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "16/11/1973",
        "cin": "E432344",
        "other_qual": "AR, MP, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "06 64 000 777 / 0522912816",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "12326",
        "nom": "ZGUENDI KARIM",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "11/08/1985",
        "cin": "BE790164",
        "other_qual": "AR, MP, RI, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TFN, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661719334 / 0522797802",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "12323",
        "nom": "FIKRI BOUCHAIB",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "12/04/1981",
        "cin": "GN106217",
        "other_qual": "AR, MP, RI, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TFN, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661486542",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "12314",
        "nom": "BIDAD MOHAMED REDA",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "18/03/1986",
        "cin": "A379536",
        "other_qual": "AR, MP, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0663607246",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "12315",
        "nom": "BOUGZOUL OMAR",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "02/05/1985",
        "cin": "D647189",
        "other_qual": "AR, MP, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NAP, NCE, NDR, OUD, OZZ, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0664292047",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "12583",
        "nom": "OUZZINE ALAA EDDINE",
        "rank": "CDB",
        "posit": "ARA",
        "dob": "22/04/1985",
        "cin": "BK319500",
        "other_qual": "AR, MP, TRE, TRI",
        "airp_qual": "AHU, ERH, ESU, GVA, MED, NCE, NDR, OUD, OZZ, TTU, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661349306",
        "email": "",
        "fonction": "CDB",
        "grade": "ARA"
    },
    {
        "matricule": "45555",
        "nom": "TAMIM AMINE",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "01/08/1993",
        "cin": "BH383336",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0628127544",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "22269",
        "nom": "DAIF ADIL",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "20/05/1972",
        "cin": "BE583303",
        "other_qual": "AR",
        "airp_qual": "AHU, ERH, ESU, NCE, NDR, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0663459905",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "22271",
        "nom": "CHANA ALI",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "11/01/1971",
        "cin": "D406646",
        "other_qual": "AR",
        "airp_qual": "AHU, ERH, ESU, NCE, NDR, ZRH",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661847600",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "22280",
        "nom": "RAQAQ YOUSSEF",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "06/06/1981",
        "cin": "A676154",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0661078348",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "45627",
        "nom": "AMRANI EL MAHDI",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "05/11/1994",
        "cin": "D829820",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0626428940",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "44527",
        "nom": "TAZI THAMI",
        "rank": "OPL",
        "posit": "DDA",
        "dob": "07/12/1998",
        "cin": "BJ420680",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B7M8",
        "restrictions": "",
        "tel": "0693698818",
        "email": "",
        "fonction": "OPL",
        "grade": "DDA"
    },
    {
        "matricule": "7427",
        "nom": "BENJELLOUN AICHA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "17/03/1967",
        "cin": "BE484921",
        "other_qual": "AR, BBJ, EXA, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661168803 / 0522296231",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "8827",
        "nom": "ANOUAR ZAKIA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "21/04/1967",
        "cin": "A356488",
        "other_qual": "001, AR, EXA, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661069272",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "9518",
        "nom": "GORMATI FOUZIA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "06/10/1968",
        "cin": "GK16472",
        "other_qual": "AR, BBJ",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661144228 / 0522940460",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "9666",
        "nom": "TAZNACHT FATIMA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "21/01/1972",
        "cin": "BE615126",
        "other_qual": "AR, CCP, EXA, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661210202",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "9672",
        "nom": "SLAOUI MOHAMMED",
        "rank": "CC",
        "posit": "MRA",
        "dob": "07/05/1969",
        "cin": "A266675",
        "other_qual": "AR, CCP, EXA, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "E90",
        "tel": "0661295448",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "9707",
        "nom": "BENHAYOUN ABDELMOUNAIM",
        "rank": "CC",
        "posit": "MMA",
        "dob": "13/08/1968",
        "cin": "BE475975",
        "other_qual": "AR, BBJ",
        "airp_qual": "",
        "ac_qual": "B737, B747",
        "restrictions": "B787",
        "tel": "0666813317",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "10727",
        "nom": "OUAHID SAMIRA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "22/09/1974",
        "cin": "A725841",
        "other_qual": "AR, BBJ",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "B787",
        "tel": "0661535706",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "10777",
        "nom": "ZRIOUEL FADWA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "04/09/1979",
        "cin": "AB238147",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0663372527",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "10869",
        "nom": "EL BADAOUI NAJLAA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "07/05/1979",
        "cin": "BH541508",
        "other_qual": "AR, BBJ",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661420979",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "10892",
        "nom": "MARMOUCH KARIMA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "18/08/1976",
        "cin": "BK153612",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0612003939",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "10992",
        "nom": "BOUAZBAOUI KARIMA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "14/02/1980",
        "cin": "G256036",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0674904813",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "11784",
        "nom": "ABBOU MAHACINE",
        "rank": "CC",
        "posit": "MRA",
        "dob": "26/10/1977",
        "cin": "AB138481",
        "other_qual": "AR, BBJ, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0638955089",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "11796",
        "nom": "BENSASSI MERYEM",
        "rank": "CC",
        "posit": "MRA",
        "dob": "30/12/1977",
        "cin": "BE719242",
        "other_qual": "AR, BBJ, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0662631268",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "40030",
        "nom": "EL OUALI HOUDA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "25/04/1984",
        "cin": "A434871",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0667042112",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "40284",
        "nom": "BENJLI SEFRIOUI REDA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "16/07/1982",
        "cin": "BK227155",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0674033833",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "40534",
        "nom": "NEBBAKI YOUSSEF",
        "rank": "CC",
        "posit": "MRA",
        "dob": "19/06/1985",
        "cin": "BL68353",
        "other_qual": "AR, INST, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0662115717",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "40858",
        "nom": "EZ ZAOUALI KHADIJA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "18/02/1984",
        "cin": "BE771735",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0663290724",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "40945",
        "nom": "BENZAARI Nabil",
        "rank": "CC",
        "posit": "MMA",
        "dob": "28/08/1980",
        "cin": "W241400",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0666599718",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "41030",
        "nom": "ED DAROUACH LALLA BTISSAM",
        "rank": "CC",
        "posit": "MMA",
        "dob": "04/05/1984",
        "cin": "AB342139",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0610414315",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "41051",
        "nom": "NAAMANE MOHAMED AMINE",
        "rank": "CC",
        "posit": "MMA",
        "dob": "23/09/1982",
        "cin": "BE772148",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "B787",
        "tel": "0666610999",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "41052",
        "nom": "MARHTOS MOHAMED",
        "rank": "CC",
        "posit": "MMA",
        "dob": "02/02/1985",
        "cin": "G489343",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0663892181",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "41124",
        "nom": "IDRISSI FARIDA",
        "rank": "CC",
        "posit": "MRA",
        "dob": "27/08/1984",
        "cin": "M374724",
        "other_qual": "AR, INST, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0665282526",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "41593",
        "nom": "BENNOUR MARIEM",
        "rank": "CC",
        "posit": "MRA",
        "dob": "25/08/1986",
        "cin": "A339498",
        "other_qual": "AR, INST",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661476636",
        "email": "",
        "fonction": "CC",
        "grade": "MRA"
    },
    {
        "matricule": "41604",
        "nom": "MABROUK ASMA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "28/07/1987",
        "cin": "JF39714",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B787",
        "restrictions": "",
        "tel": "0677216544",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "41982",
        "nom": "ASSADI SADDIK",
        "rank": "CC",
        "posit": "MMA",
        "dob": "24/06/1987",
        "cin": "BK339534",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "B787",
        "tel": "0663107195",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42475",
        "nom": "EL MALIKI YOUNESS",
        "rank": "CC",
        "posit": "MMA",
        "dob": "11/03/1992",
        "cin": "BK386912",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0642296028 / 0522938172",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42541",
        "nom": "OUHSSINE SOUKAINA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "02/09/1988",
        "cin": "H490146",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0661404874",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42656",
        "nom": "YAKINE ZINEB",
        "rank": "CC",
        "posit": "MMA",
        "dob": "31/10/1992",
        "cin": "M524884",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "B787",
        "tel": "0604952162",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42672",
        "nom": "EL KHATTAB KHAOULA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "20/06/1993",
        "cin": "AE28687",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0662785830",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42724",
        "nom": "KAMOUN ZINEB",
        "rank": "CC",
        "posit": "MMA",
        "dob": "10/04/1992",
        "cin": "D793387",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0656873351",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "42807",
        "nom": "FILALI ROTBI MOHAMMED",
        "rank": "CC",
        "posit": "MMA",
        "dob": "31/01/1990",
        "cin": "BK357404",
        "other_qual": "AR, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "B787",
        "tel": "0627043041",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "43258",
        "nom": "EL MANSOURI IMANE",
        "rank": "CC",
        "posit": "MMA",
        "dob": "28/02/1992",
        "cin": "A393798",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "B787",
        "tel": "0661999923",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "43323",
        "nom": "EL AFRHANI ZAKIA",
        "rank": "CC",
        "posit": "MMA",
        "dob": "23/05/1991",
        "cin": "AD207907",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0662061820",
        "email": "",
        "fonction": "CC",
        "grade": "MMA"
    },
    {
        "matricule": "44756",
        "nom": "ZOUINE IKRAM",
        "rank": "CA",
        "posit": "MMA",
        "dob": "15/08/1999",
        "cin": "GA217506",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0703701404",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44563",
        "nom": "BELAARIF OUMAIMA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "08/09/1998",
        "cin": "BJ448613",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0777518115",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44608",
        "nom": "KHALIL SAFAA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "19/12/1999",
        "cin": "WA271331",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0653653219 / 0601287324",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "45217",
        "nom": "MESKINE HIBA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "01/01/2001",
        "cin": "BE912625",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0776004703",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "45118",
        "nom": "BOUFARES SAFAE",
        "rank": "CA",
        "posit": "MMA",
        "dob": "28/09/1999",
        "cin": "AE279052",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0622295657",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "45093",
        "nom": "LABDLAOUI IMANE",
        "rank": "CA",
        "posit": "MMA",
        "dob": "02/01/1999",
        "cin": "SH195969",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0606144190",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44722",
        "nom": "SAMAOUI MOUAD",
        "rank": "CA",
        "posit": "MMA",
        "dob": "10/01/1999",
        "cin": "TK25450",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0624176261",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44594",
        "nom": "HADHOUDI HIND",
        "rank": "CA",
        "posit": "MMA",
        "dob": "14/11/1994",
        "cin": "BB123854",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0620498357",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44102",
        "nom": "BELOUAD DOHA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "26/04/1997",
        "cin": "BB147459",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0625611071",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43621",
        "nom": "TABANNA SOUKAINA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "30/07/1993",
        "cin": "N381730",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0662616530",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "45110",
        "nom": "ZOUINI OUMNIA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "11/03/1996",
        "cin": "D967194",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0643442421",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44318",
        "nom": "MOHSEN SALWA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "19/02/1995",
        "cin": "BE884047",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0664482599",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44368",
        "nom": "BEN EL KHALDI HANIA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "08/03/1994",
        "cin": "BE866728",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "07 01 28 95 33",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44596",
        "nom": "HADRY NADA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "22/03/2000",
        "cin": "BB172692",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0628396749",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44927",
        "nom": "AKKA A'ABIRE",
        "rank": "CA",
        "posit": "MMA",
        "dob": "11/10/1995",
        "cin": "CB288782",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0638688603",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44476",
        "nom": "RACHIDY ANASS",
        "rank": "CA",
        "posit": "MMA",
        "dob": "02/12/1994",
        "cin": "BH463418",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0640165901",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44622",
        "nom": "NASYF HANA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "11/01/1999",
        "cin": "BK678432",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0688861715",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44001",
        "nom": "HAJJI M'HAMED AMINE",
        "rank": "CA",
        "posit": "MMA",
        "dob": "27/09/1995",
        "cin": "BE876009",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, E90",
        "restrictions": "",
        "tel": "0664174063",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44636",
        "nom": "SIDANE KENZA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "03/03/1998",
        "cin": "BK678668",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0622199447",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44387",
        "nom": "ERROHAILI RACHID",
        "rank": "CA",
        "posit": "MMA",
        "dob": "13/09/1997",
        "cin": "BH484380",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "06 94 58 66 01/ 06 09 38 69 84",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44603",
        "nom": "KARIM RACHIDA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "13/06/1999",
        "cin": "BB173033",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0632986261",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44727",
        "nom": "EL IDRISSI BOUHAJEB AYMAN",
        "rank": "CA",
        "posit": "MMA",
        "dob": "06/02/1998",
        "cin": "BB156192",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0614479557",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44107",
        "nom": "ELBAZ NOUHAILA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "14/01/1998",
        "cin": "BJ441320",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0619262854",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "45001",
        "nom": "OUAFI HAJAR",
        "rank": "CA",
        "posit": "MMA",
        "dob": "23/04/1999",
        "cin": "AE271716",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0613346583",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44941",
        "nom": "EL AARACH IMANE",
        "rank": "CA",
        "posit": "MMA",
        "dob": "10/04/1996",
        "cin": "bb149695",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B787",
        "restrictions": "",
        "tel": "0615765190",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44623",
        "nom": "NOUSSAIR HIND",
        "rank": "CA",
        "posit": "MMA",
        "dob": "11/12/1998",
        "cin": "BL147096",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0633783355",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44948",
        "nom": "ELBAZ MOHAMED",
        "rank": "CA",
        "posit": "MMA",
        "dob": "10/09/1998",
        "cin": "K503715",
        "other_qual": "",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0633967221",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "44760",
        "nom": "HOMRANI NABIL",
        "rank": "CA",
        "posit": "MMA",
        "dob": "17/12/1994",
        "cin": "BE875154",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0618320437",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "40901",
        "nom": "ELGHAZYA Imad",
        "rank": "CA",
        "posit": "MMA",
        "dob": "04/01/1987",
        "cin": "BE805180",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0623122626",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "41324",
        "nom": "EL MAADANI KARIM",
        "rank": "CA",
        "posit": "MMA",
        "dob": "09/10/1987",
        "cin": "A437880",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0671884178",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "41582",
        "nom": "BASRIR NADIA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "11/01/1987",
        "cin": "BK252491",
        "other_qual": "AR, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0664460808",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "42526",
        "nom": "HANAFI MOHAMMED",
        "rank": "CA",
        "posit": "MMA",
        "dob": "03/12/1987",
        "cin": "AA11530",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787",
        "restrictions": "",
        "tel": "0622034667",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "42619",
        "nom": "JANAH YASMINA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "16/03/1989",
        "cin": "BE827279",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0649181822",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43301",
        "nom": "IDOUIAAZA AYOUB",
        "rank": "CA",
        "posit": "MMA",
        "dob": "26/07/1993",
        "cin": "Q304562",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0628889692",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43318",
        "nom": "BENFARHOUN Zakaria",
        "rank": "CA",
        "posit": "MMA",
        "dob": "15/04/1989",
        "cin": "A666091",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0622700160",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43330",
        "nom": "HAMZAN SARA",
        "rank": "CA",
        "posit": "MMA",
        "dob": "31/07/1991",
        "cin": "BJ393931",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0727202740",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43348",
        "nom": "SFA MOHAMED",
        "rank": "CA",
        "posit": "MMA",
        "dob": "20/04/1989",
        "cin": "BE823494",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0637192099",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43404",
        "nom": "BENAMAR DRISS",
        "rank": "CA",
        "posit": "MMA",
        "dob": "04/11/1989",
        "cin": "G611438",
        "other_qual": "AR, LC, MV",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0670525915",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43440",
        "nom": "NAAMANE ZINEB",
        "rank": "CA",
        "posit": "MMA",
        "dob": "16/09/1991",
        "cin": "BK366765",
        "other_qual": "AR, LC",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0653025426",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    },
    {
        "matricule": "43515",
        "nom": "MAHMOUD MOHAMMED",
        "rank": "CA",
        "posit": "MMA",
        "dob": "03/01/1994",
        "cin": "F539960",
        "other_qual": "AR",
        "airp_qual": "",
        "ac_qual": "B737, B747, B787, E90",
        "restrictions": "",
        "tel": "0650829903",
        "email": "",
        "fonction": "CA",
        "grade": "MMA"
    }
];

    let crew = [];
    let editingIndex = -1;
    let currentFilter = 'all';
    let searchQuery = '';

    // Règle POSIT demandée :
    // - si Rank=CDB et OTHER QUAL inclut TRI ou TRE -> ARA sinon DDA
    // - si Rank=OPL -> DDA
    // - si Rank=CC et OTHER QUAL inclut INST ou EXA -> MRA sinon MMA
    // - si Rank=CA -> MMA
    function calcPosit(rank, otherQual) {
        const r = String(rank || '').trim().toUpperCase();
        const oq = String(otherQual || '').trim().toUpperCase();
        if (r === 'CDB') {
            if (oq.includes('TRI') || oq.includes('TRE')) return 'ARA';
            return 'DDA';
        } else if (r === 'OPL') {
            return 'DDA';
        } else if (r === 'CC') {
            if (oq.includes('INST') || oq.includes('EXA')) return 'MRA';
            return 'MMA';
        } else if (r === 'CA') {
            return 'MMA';
        }
        return 'DDA';
    }

    function formatDob(dobStr) {
        if (!dobStr) return '';
        const months = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const m = String(dobStr).trim().match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
        if (m) {
            const day = m[1].padStart(2, '0');
            const mon = months[m[2].toLowerCase()] || m[2];
            const yr = m[3];
            return day + '/' + mon + '/' + yr;
        }
        return String(dobStr).trim();
    }

    function sanitizeMember(m) {
        const rank = String(m.rank || m.fonction || '').trim().toUpperCase() || 'CDB';
        const other_qual = String(m.other_qual || '').trim();
        const posit = String(m.posit || '').trim().toUpperCase() || calcPosit(rank, other_qual);
        const dob = formatDob(m.dob);

        return {
            matricule: String(m.matricule || '').trim().replace(/[^0-9]/g, ''),
            nom: String(m.nom || '').trim(),
            rank: rank,
            posit: posit,
            dob: dob,
            cin: String(m.cin || '').trim(),
            other_qual: other_qual,
            airp_qual: String(m.airp_qual || '').trim(),
            ac_qual: String(m.ac_qual || '').trim(),
            restrictions: String(m.restrictions || '').trim(),
            tel: String(m.tel || '').trim(),
            email: String(m.email || '').trim(),
            // rétro-compatibilité avec les formulaires existants
            fonction: rank,
            grade: posit
        };
    }

    function loadLocal() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) {
                // Si la version locale n'a pas les téléphones ou les Ranks complets, mettre à jour depuis DEFAULT_CREW
                if (saved.length < DEFAULT_CREW.length || !saved.some(s => s.tel || s.rank)) {
                    const merged = DEFAULT_CREW.map(sanitizeMember);
                    saved.forEach(s => {
                        const idx = merged.findIndex(m => m.matricule && m.matricule === s.matricule);
                        if (idx >= 0) {
                            if (s.tel) merged[idx].tel = s.tel;
                            if (s.email) merged[idx].email = s.email;
                        } else {
                            merged.push(sanitizeMember(s));
                        }
                    });
                    crew = merged;
                } else {
                    crew = saved.map(sanitizeMember);
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
                return;
            }
        } catch (e) {}
        crew = DEFAULT_CREW.map(sanitizeMember);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
    }

    function loadServer(callback) {
        fetch(API_URL)
            .then(res => {
                if (!res.ok) throw new Error('API server non disponible');
                return res.json();
            })
            .then(res => {
                if (res && res.ok && Array.isArray(res.data) && res.data.length) {
                    crew = res.data.map(sanitizeMember);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
                    render();
                    if (typeof populateCrewFields === 'function') populateCrewFields();
                } else {
                    loadStaticJsonOrLocal(callback);
                    return;
                }
                if (callback) callback();
            })
            .catch(() => {
                loadStaticJsonOrLocal(callback);
            });
    }

    function loadStaticJsonOrLocal(callback) {
        fetch('data/crew.json')
            .then(r => {
                if (!r.ok) throw new Error('data/crew.json non trouvé');
                return r.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    const localSaved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
                    if (localSaved.length < data.length || !localSaved.some(s => s.tel || s.rank)) {
                        crew = data.map(sanitizeMember);
                    } else {
                        crew = localSaved.map(sanitizeMember);
                    }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
                    render();
                    if (typeof populateCrewFields === 'function') populateCrewFields();
                } else {
                    loadLocal();
                    render();
                }
                if (callback) callback();
            })
            .catch(() => {
                loadLocal();
                render();
                if (callback) callback();
            });
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(crew));
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': localStorage.getItem('bbj_token') || ''
            },
            body: JSON.stringify({ data: crew })
        }).catch(err => {
            console.warn("Écriture serveur hors-ligne, données conservées en cache local:", err);
        });

        if (typeof populateCrewFields === 'function') populateCrewFields();
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function toast(msg, isError) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.className = 'toast show' + (isError ? ' error' : '');
        clearTimeout(el._t);
        el._t = setTimeout(function() { el.className = 'toast'; }, 2500);
    }

    /* ---------------- Parseur CSV Avancé & Importateur ---------------- */

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const rows = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith('"sep=')) continue;
            let row = [];
            let inQuotes = false;
            let token = '';
            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                if (char === '"') {
                    if (inQuotes && line[c + 1] === '"') {
                        token += '"';
                        c++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(token);
                    token = '';
                } else {
                    token += char;
                }
            }
            row.push(token);
            rows.push(row.map(cell => cell.replace(/^="?"?/, '').replace(/"?$/, '').replace(/^"/, '').replace(/"$/, '').trim()));
        }
        return rows;
    }

    function importCrewCSV(csvText) {
        if (!csvText || typeof csvText !== 'string') return;
        const rows = parseCSV(csvText);
        if (!rows.length) {
            alert("Fichier CSV vide ou illisible.");
            return;
        }

        // Détection du type de CSV
        // Type 1 : Crew Contact (contient 'Number/Address' ou 'Priority' ou 'work')
        // Type 2 : Crew Info (contient 'Date of Birth', 'Civil Id', 'Other Qual', etc.)
        const header = rows.find(r => r.some(c => c.toLowerCase().includes('employee number') || c.toLowerCase().includes('name')));
        const isContactCSV = rows.some(r => r.some(c => c.toLowerCase() === 'work' || c.toLowerCase().includes('number/address') || c.toLowerCase() === 'mobile'));

        let updatedCount = 0;

        if (isContactCSV) {
            // Import Contacts CSV : mise à jour des numéros de téléphone
            rows.forEach(r => {
                if (!r || r.length < 5) return;
                const emp = String(r[0] || '').replace(/[^0-9]/g, '').trim();
                const phone = String(r[8] || r[7] || '').trim();
                if (!emp || !phone || phone.toLowerCase().includes('number') || phone.length < 6) return;

                // Nettoyer numéro
                let cleanPhone = phone;
                if (/^[567]\d{8}$/.test(cleanPhone)) cleanPhone = '0' + cleanPhone;

                const member = crew.find(m => m.matricule === emp);
                if (member) {
                    if (!member.tel) {
                        member.tel = cleanPhone;
                    } else if (!member.tel.includes(cleanPhone)) {
                        member.tel = member.tel + ' / ' + cleanPhone;
                    }
                    updatedCount++;
                }
            });
            toast(updatedCount + ' contact(s) téléphonique(s) mis à jour avec succès !');
        } else {
            // Import Crew Info CSV : création / mise à jour de membres
            rows.forEach(r => {
                if (!r || r.length < 4) return;
                const emp = String(r[0] || '').replace(/[^0-9]/g, '').trim();
                const nom = String(r[1] || '').replace(',', '').trim();
                if (!emp || !nom || emp.toLowerCase().includes('employee')) return;

                const dob = formatDob(r[2]);
                const cin = String(r[3] || '').trim();
                const rank = String(r[10] || '').trim() || 'CDB';
                const other_qual = String(r[12] || '').trim();
                const airp_qual = String(r[13] || '').trim();
                const ac_qual = String(r[14] || '').trim();
                const restrictions = String(r[15] || '').trim();
                const posit = calcPosit(rank, other_qual);

                const existingIdx = crew.findIndex(m => m.matricule === emp);
                const newMember = sanitizeMember({
                    matricule: emp,
                    nom: nom,
                    rank: rank,
                    posit: posit,
                    dob: dob,
                    cin: cin,
                    other_qual: other_qual,
                    airp_qual: airp_qual,
                    ac_qual: ac_qual,
                    restrictions: restrictions,
                    tel: (existingIdx >= 0 && crew[existingIdx].tel) ? crew[existingIdx].tel : '',
                    email: (existingIdx >= 0 && crew[existingIdx].email) ? crew[existingIdx].email : ''
                });

                if (existingIdx >= 0) {
                    crew[existingIdx] = Object.assign(crew[existingIdx], newMember);
                } else {
                    crew.push(newMember);
                }
                updatedCount++;
            });
            toast(updatedCount + ' navigant(s) mis à jour depuis le CSV Crew Info !');
        }

        persist();
        render();
    }

    function setupCSVImportButton(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const inp = document.getElementById(inputId);
        if (!btn || !inp) return;

        btn.addEventListener('click', function() {
            inp.value = '';
            inp.click();
        });

        inp.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                importCrewCSV(evt.target.result);
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    /* ---------------- Rendu Graphique des Badges ---------------- */

    function formatBadges(text) {
        if (!text) return '<span style="color:var(--text-muted); opacity:0.5;">—</span>';
        const parts = text.split(',').map(p => p.trim()).filter(Boolean);
        return parts.map(part => {
            const upper = part.toUpperCase();
            if (upper === 'BBJ') {
                return '<span class="badge-tag badge-bbj" title="Qualifié Boeing Business Jet">⭐ BBJ</span>';
            }
            if (upper === 'TRE' || upper === 'TRI' || upper === 'RI') {
                return '<span class="badge-tag badge-instructor" title="Instructeur / Examinateur">' + escapeHtml(part) + '</span>';
            }
            if (upper === 'MP') {
                return '<span class="badge-tag badge-mp" title="Moniteur Pilote">' + escapeHtml(part) + '</span>';
            }
            if (upper === 'B737' || upper === 'B7M8' || upper === 'B787' || upper === 'B747') {
                return '<span class="badge-tag badge-ac">' + escapeHtml(part) + '</span>';
            }
            return '<span class="badge-tag badge-subtle">' + escapeHtml(part) + '</span>';
        }).join(' ');
    }

    function formatRankBadge(rank) {
        const r = String(rank || '').trim().toUpperCase();
        if (r === 'CDB') return '<span class="badge-tag badge-rank-cdb" style="background:#ef44441a; color:#dc2626; border:1px solid #ef44444d; font-weight:700;">CDB</span>';
        if (r === 'OPL') return '<span class="badge-tag badge-rank-opl" style="background:#3b82f61a; color:#2563eb; border:1px solid #3b82f64d; font-weight:700;">OPL</span>';
        if (r === 'CC') return '<span class="badge-tag badge-rank-cc" style="background:#8b5cf61a; color:#7c3aed; border:1px solid #8b5cf64d; font-weight:700;">CC</span>';
        if (r === 'CA') return '<span class="badge-tag badge-rank-ca" style="background:#10b9811a; color:#059669; border:1px solid #10b9814d; font-weight:700;">CA</span>';
        return '<span class="badge-tag badge-subtle">' + escapeHtml(r || '—') + '</span>';
    }

    function formatPositBadge(posit) {
        const p = String(posit || '').trim().toUpperCase();
        if (p === 'ARA') return '<span class="badge-tag badge-posit-ara" style="background:#f59e0b1f; color:#d97706; border:1px solid #f59e0b66; font-weight:800;" title="Commandant Instructeur / Examinateur">ARA</span>';
        if (p === 'DDA') return '<span class="badge-tag badge-posit-dda" style="background:#3b82f61f; color:#1d4ed8; border:1px solid #3b82f666; font-weight:700;" title="Pilote / OPL standard">DDA</span>';
        if (p === 'MRA') return '<span class="badge-tag badge-posit-mra" style="background:#ec48991f; color:#db2777; border:1px solid #ec489966; font-weight:800;" title="Chef de Cabine Instructeur">MRA</span>';
        if (p === 'MMA') return '<span class="badge-tag badge-posit-mma" style="background:#10b9811f; color:#047857; border:1px solid #10b98166; font-weight:700;" title="PNC standard">MMA</span>';
        return '<span class="badge-tag badge-subtle">' + escapeHtml(p || '—') + '</span>';
    }

    function formatContact(m) {
        const items = [];
        if (m.tel) {
            const phones = m.tel.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
            phones.forEach(p => {
                const cleanTel = p.replace(/\s+/g, '');
                items.push('<a href="tel:' + escapeHtml(cleanTel) + '" class="crew-contact-btn crew-tel-btn" title="Appeler ' + escapeHtml(m.nom) + '">📞 ' + escapeHtml(p) + '</a>');
            });
        }
        if (m.email) {
            items.push('<a href="mailto:' + escapeHtml(m.email) + '" class="crew-contact-btn crew-mail-btn" title="Envoyer un email à ' + escapeHtml(m.nom) + '">✉️ ' + escapeHtml(m.email) + '</a>');
        }
        if (!items.length) {
            return '<span style="color:var(--text-muted); font-size:11.5px; opacity:0.6;">Non renseigné</span>';
        }
        return '<div style="display:flex; flex-direction:column; gap:4px;">' + items.join('') + '</div>';
    }

    function getFilteredList() {
        let list = crew.slice();

        if (currentFilter === 'bbj') {
            list = list.filter(m => String(m.other_qual || '').toUpperCase().includes('BBJ'));
        } else if (currentFilter === 'tre_tri') {
            list = list.filter(m => {
                const oq = String(m.other_qual || '').toUpperCase();
                return oq.includes('TRE') || oq.includes('TRI') || oq.includes('RI');
            });
        }

        if (searchQuery) {
            const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
            list = list.filter(m => {
                const str = (m.nom + ' ' + m.matricule + ' ' + m.cin + ' ' + m.rank + ' ' + m.posit + ' ' + m.dob + ' ' + m.other_qual + ' ' + m.airp_qual + ' ' + m.ac_qual + ' ' + m.restrictions + ' ' + m.tel + ' ' + m.email).toLowerCase();
                return words.every(w => str.includes(w));
            });
        }

        return list;
    }

    function updateCounts() {
        const allCount = crew.length;
        const bbjCount = crew.filter(m => String(m.other_qual || '').toUpperCase().includes('BBJ')).length;
        const instCount = crew.filter(m => {
            const oq = String(m.other_qual || '').toUpperCase();
            return oq.includes('TRE') || oq.includes('TRI') || oq.includes('RI');
        }).length;

        const elAll = document.getElementById('cc-count-all');
        const elBbj = document.getElementById('cc-count-bbj');
        const elInst = document.getElementById('cc-count-instructors');

        if (elAll) elAll.textContent = allCount;
        if (elBbj) elBbj.textContent = bbjCount;
        if (elInst) elInst.textContent = instCount;
    }

    function render() {
        updateCounts();

        const tbody = document.getElementById('crew-contact-tbody');
        const empty = document.getElementById('crew-contact-empty');
        const summaryText = document.getElementById('cc-summary-text');
        if (!tbody) return;

        const filtered = getFilteredList();

        if (summaryText) {
            if (searchQuery || currentFilter !== 'all') {
                summaryText.textContent = filtered.length + ' membre(s) affiché(s) sur ' + crew.length + ' au total';
            } else {
                summaryText.textContent = crew.length + ' membres navigants enregistrés au total';
            }
        }

        if (!filtered.length) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        let html = '';
        filtered.forEach(function(m) {
            const realIdx = crew.indexOf(m);
            const isBbj = String(m.other_qual || '').toUpperCase().includes('BBJ');

            html += '<tr class="' + (isBbj ? 'row-bbj-member' : '') + '">'
                + '<td style="text-align:center;"><span class="badge-matricule">' + escapeHtml(m.matricule) + '</span></td>'
                + '<td><div class="crew-name-cell">'
                    + '<strong style="color:var(--text-primary); font-size:13.5px;">' + escapeHtml(m.nom) + '</strong>'
                    + (isBbj ? ' <span class="badge-star-mini" title="Qualifié BBJ">⭐</span>' : '')
                + '</div></td>'
                + '<td style="text-align:center;">' + formatRankBadge(m.rank) + '</td>'
                + '<td style="text-align:center;">' + formatPositBadge(m.posit) + '</td>'
                + '<td><span class="badge-cin">' + escapeHtml(m.cin || '—') + '</span></td>'
                + '<td><span style="font-size:12px; color:var(--text-secondary); font-weight:600;">' + escapeHtml(m.dob || '—') + '</span></td>'
                + '<td>' + formatBadges(m.other_qual) + '</td>'
                + '<td><div class="table-airp-cell" title="' + escapeHtml(m.airp_qual) + '">' + escapeHtml(m.airp_qual || '—') + '</div></td>'
                + '<td>' + formatBadges(m.ac_qual) + '</td>'
                + '<td>' + (m.restrictions ? '<span class="badge-restriction">' + escapeHtml(m.restrictions) + '</span>' : '<span style="color:var(--text-muted); opacity:0.5;">—</span>') + '</td>'
                + '<td>' + formatContact(m) + '</td>'
                + '<td style="text-align:center; white-space:nowrap;">'
                    + '<button type="button" class="btn btn-small btn-edit-crew" data-index="' + realIdx + '" title="Modifier">✎</button> '
                    + '<button type="button" class="btn btn-small btn-danger btn-del-crew" data-index="' + realIdx + '" title="Supprimer">✕</button>'
                + '</td>'
                + '</tr>';
        });

        tbody.innerHTML = html;

        tbody.querySelectorAll('.btn-edit-crew').forEach(btn => {
            btn.addEventListener('click', function() {
                const i = parseInt(this.dataset.index, 10);
                startEdit(i);
            });
        });

        tbody.querySelectorAll('.btn-del-crew').forEach(btn => {
            btn.addEventListener('click', function() {
                const i = parseInt(this.dataset.index, 10);
                removeMember(i);
            });
        });
    }

    function toggleForm(show) {
        const box = document.getElementById('crew-contact-form-box');
        const btnText = document.getElementById('btn-toggle-crew-text');
        if (!box) return;

        const isCurrentlyShown = box.style.display !== 'none';
        const willShow = (typeof show === 'boolean') ? show : !isCurrentlyShown;

        box.style.display = willShow ? 'block' : 'none';
        if (btnText) btnText.textContent = willShow ? '✕ Fermer le formulaire' : '＋ Ajouter un navigant';

        if (willShow && editingIndex === -1) {
            const nomInput = document.getElementById('cc-nom');
            if (nomInput) nomInput.focus();
        }
    }

    function updateFormPosit() {
        const rankEl = document.getElementById('cc-rank');
        const oqEl = document.getElementById('cc-other-qual');
        const positEl = document.getElementById('cc-posit');
        if (rankEl && oqEl && positEl) {
            positEl.value = calcPosit(rankEl.value, oqEl.value);
        }
    }

    function resetForm() {
        editingIndex = -1;
        document.getElementById('crew-form-title').textContent = 'Nouveau membre d\'équipage';
        const fields = ['nom', 'matricule', 'cin', 'dob', 'other-qual', 'airp-qual', 'ac-qual', 'restrictions', 'tel', 'email'];
        fields.forEach(f => {
            const el = document.getElementById('cc-' + f);
            if (el) el.value = '';
        });
        const rEl = document.getElementById('cc-rank');
        if (rEl) rEl.value = 'CDB';
        const pEl = document.getElementById('cc-posit');
        if (pEl) pEl.value = 'ARA';

        const sBtn = document.getElementById('cc-save');
        if (sBtn) sBtn.textContent = '💾 Enregistrer';
    }

    function startEdit(i) {
        const m = crew[i];
        if (!m) return;

        editingIndex = i;
        document.getElementById('crew-form-title').textContent = 'Modifier : ' + m.nom + ' (' + m.matricule + ')';
        document.getElementById('cc-nom').value = m.nom || '';
        document.getElementById('cc-matricule').value = m.matricule || '';
        document.getElementById('cc-cin').value = m.cin || '';
        document.getElementById('cc-dob').value = m.dob || '';
        const rEl = document.getElementById('cc-rank');
        if (rEl) rEl.value = m.rank || 'CDB';
        document.getElementById('cc-other-qual').value = m.other_qual || '';
        const pEl = document.getElementById('cc-posit');
        if (pEl) pEl.value = m.posit || calcPosit(m.rank, m.other_qual);
        document.getElementById('cc-airp-qual').value = m.airp_qual || '';
        document.getElementById('cc-ac-qual').value = m.ac_qual || '';
        document.getElementById('cc-restrictions').value = m.restrictions || '';
        document.getElementById('cc-tel').value = m.tel || '';
        document.getElementById('cc-email').value = m.email || '';

        const sBtn = document.getElementById('cc-save');
        if (sBtn) sBtn.textContent = '💾 Mettre à jour';

        toggleForm(true);
        const box = document.getElementById('crew-contact-form-box');
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const nEl = document.getElementById('cc-nom');
        if (nEl) nEl.focus();
    }

    function save() {
        const nom = (document.getElementById('cc-nom').value || '').trim();
        const matricule = (document.getElementById('cc-matricule').value || '').trim().replace(/[^0-9]/g, '');

        if (!nom || !matricule) {
            alert('Veuillez renseigner obligatoirement le Nom & Prénom ainsi que le Matricule.');
            return;
        }

        const duplicate = crew.some((m, idx) => idx !== editingIndex && m.matricule === matricule);
        if (duplicate) {
            alert('Un membre d\'équipage avec le matricule « ' + matricule + ' » existe déjà.');
            return;
        }

        const rank = (document.getElementById('cc-rank') ? document.getElementById('cc-rank').value : 'CDB');
        const other_qual = document.getElementById('cc-other-qual').value;
        const positInp = document.getElementById('cc-posit');
        const posit = (positInp && positInp.value.trim()) ? positInp.value.trim().toUpperCase() : calcPosit(rank, other_qual);

        const member = sanitizeMember({
            nom: nom,
            matricule: matricule,
            rank: rank,
            posit: posit,
            cin: document.getElementById('cc-cin').value,
            dob: document.getElementById('cc-dob').value,
            other_qual: other_qual,
            airp_qual: document.getElementById('cc-airp-qual').value,
            ac_qual: document.getElementById('cc-ac-qual').value,
            restrictions: document.getElementById('cc-restrictions').value,
            tel: document.getElementById('cc-tel').value,
            email: document.getElementById('cc-email').value,
            fonction: rank,
            grade: posit
        });

        if (editingIndex >= 0) {
            crew[editingIndex] = member;
        } else {
            crew.unshift(member);
        }

        persist();
        render();
        resetForm();
        toggleForm(false);
        toast('Membre enregistré avec succès !');
    }

    function removeMember(i) {
        const m = crew[i];
        if (!m) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer « ' + m.nom + ' » (' + m.matricule + ') ?')) return;

        crew.splice(i, 1);
        if (editingIndex === i) {
            resetForm();
            toggleForm(false);
        } else if (editingIndex > i) {
            editingIndex--;
        }

        persist();
        render();
        toast('Membre supprimé.');
    }

    function addMemberDirect(nom, matricule, fonction, grade, posit) {
        nom = String(nom || '').trim();
        matricule = String(matricule || '').trim().replace(/[^0-9]/g, '');
        if (!nom) return null;
        if (!matricule) matricule = String(Date.now()).slice(-5);

        const rank = fonction || 'CDB';
        const finalPosit = posit || grade || calcPosit(rank, '');

        const record = sanitizeMember({
            nom: nom,
            matricule: matricule,
            rank: rank,
            posit: finalPosit,
            fonction: rank,
            grade: finalPosit
        });

        const existingIdx = crew.findIndex(m => m.matricule === matricule || (m.nom.toLowerCase() === nom.toLowerCase() && nom.length > 2));
        if (existingIdx >= 0) {
            crew[existingIdx] = Object.assign(crew[existingIdx], record);
        } else {
            crew.unshift(record);
        }

        persist();
        render();
        return record;
    }

    function init() {
        loadLocal();
        render();
        loadServer();

        // Boutons formulaire
        const toggleBtn = document.getElementById('btn-toggle-crew-form');
        if (toggleBtn) toggleBtn.addEventListener('click', () => toggleForm());

        const closeBtn = document.getElementById('btn-close-crew-form');
        if (closeBtn) closeBtn.addEventListener('click', () => toggleForm(false));

        const saveBtn = document.getElementById('cc-save');
        if (saveBtn) saveBtn.addEventListener('click', save);

        const cancelBtn = document.getElementById('cc-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            resetForm();
            toggleForm(false);
        });

        // Mise à jour automatique de POSIT lors du changement de Rank ou Other Qual
        const rankInput = document.getElementById('cc-rank');
        if (rankInput) rankInput.addEventListener('change', updateFormPosit);
        const oqInput = document.getElementById('cc-other-qual');
        if (oqInput) oqInput.addEventListener('input', updateFormPosit);

        // Recherche en temps réel
        const searchInput = document.getElementById('crew-contact-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchQuery = this.value.trim();
                render();
            });
        }

        // Filtres
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter || 'all';
                render();
            });
        });

        // Câblage des boutons "UPDATE CREW (Importer CSV)"
        setupCSVImportButton('btn-update-crew-csv', 'inp-crew-csv');
        setupCSVImportButton('btn-update-crew-csv-cc', 'inp-crew-csv-cc');

        window.CREW = {
            list: function() { return crew.slice(); },
            reload: function() { loadServer(); },
            add: addMemberDirect,
            calcPosit: calcPosit,
            importCSV: importCrewCSV,
            render: render
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
