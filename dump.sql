--
-- PostgreSQL database dump
--

-- Dumped from database version 13.2
-- Dumped by pg_dump version 13.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'ACCEPTED',
    'DELETED'
);


ALTER TYPE public."RegistrationStatus" OWNER TO "user";

--
-- Name: ResultSource; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."ResultSource" AS ENUM (
    'WCA_OFFICIAL',
    'WCA_WCIF',
    'WCA_LIVE'
);


ALTER TYPE public."ResultSource" OWNER TO "user";

--
-- Name: RoundType; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public."RoundType" AS ENUM (
    'LEGACY_QUALIFICATION_ROUND',
    'LEGACY_FIRST_ROUND',
    'LEGACY_ROUND',
    'FIRST_ROUND',
    'SECOND_ROUND',
    'SEMI_FINAL',
    'FINAL'
);


ALTER TYPE public."RoundType" OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Competition; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Competition" (
    id integer NOT NULL,
    "wcaId" text NOT NULL,
    name text NOT NULL,
    "startDate" text NOT NULL,
    "endDate" text NOT NULL,
    cancelled_at text,
    "cityName" text NOT NULL,
    "countryId" text NOT NULL,
    "eventIds" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Competition" OWNER TO "user";

--
-- Name: Competition_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Competition_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Competition_id_seq" OWNER TO "user";

--
-- Name: Competition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Competition_id_seq" OWNED BY public."Competition".id;


--
-- Name: Event; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Event" (
    id integer NOT NULL,
    "wcaId" text NOT NULL,
    name text NOT NULL,
    rank integer NOT NULL
);


ALTER TABLE public."Event" OWNER TO "user";

--
-- Name: Event_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Event_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Event_id_seq" OWNER TO "user";

--
-- Name: Event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Event_id_seq" OWNED BY public."Event".id;


--
-- Name: Person; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Person" (
    id integer NOT NULL,
    "wcaUserId" integer,
    name text NOT NULL,
    "subId" integer,
    "wcaId" text,
    "countryId" text NOT NULL
);


ALTER TABLE public."Person" OWNER TO "user";

--
-- Name: Person_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Person_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Person_id_seq" OWNER TO "user";

--
-- Name: Person_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Person_id_seq" OWNED BY public."Person".id;


--
-- Name: Person_subId_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Person_subId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Person_subId_seq" OWNER TO "user";

--
-- Name: Person_subId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Person_subId_seq" OWNED BY public."Person"."subId";


--
-- Name: Registration; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Registration" (
    "competitionId" text NOT NULL,
    "personId" integer NOT NULL,
    "registrantId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."RegistrationStatus" NOT NULL,
    "eventIds" text[]
);


ALTER TABLE public."Registration" OWNER TO "user";

--
-- Name: Result; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Result" (
    id integer NOT NULL,
    "wcaResultId" integer,
    "personId" integer NOT NULL,
    "competitionId" text NOT NULL,
    "eventId" text NOT NULL,
    "roundNumber" integer NOT NULL,
    pos integer,
    best integer NOT NULL,
    average integer,
    attempts integer[],
    source public."ResultSource" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "registrantId" integer
);


ALTER TABLE public."Result" OWNER TO "user";

--
-- Name: Result_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Result_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Result_id_seq" OWNER TO "user";

--
-- Name: Result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Result_id_seq" OWNED BY public."Result".id;


--
-- Name: Round; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Round" (
    "competitionId" text NOT NULL,
    "eventId" text NOT NULL,
    number integer NOT NULL,
    type public."RoundType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "formatId" text NOT NULL
);


ALTER TABLE public."Round" OWNER TO "user";

--
-- Name: _PersonCompetitions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."_PersonCompetitions" (
    "A" text NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_PersonCompetitions" OWNER TO "user";

--
-- Name: Competition id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Competition" ALTER COLUMN id SET DEFAULT nextval('public."Competition_id_seq"'::regclass);


--
-- Name: Event id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Event" ALTER COLUMN id SET DEFAULT nextval('public."Event_id_seq"'::regclass);


--
-- Name: Person id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Person" ALTER COLUMN id SET DEFAULT nextval('public."Person_id_seq"'::regclass);


--
-- Name: Person subId; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Person" ALTER COLUMN "subId" SET DEFAULT nextval('public."Person_subId_seq"'::regclass);


--
-- Name: Result id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result" ALTER COLUMN id SET DEFAULT nextval('public."Result_id_seq"'::regclass);


--
-- Data for Name: Competition; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Competition" (id, "wcaId", name, "startDate", "endDate", cancelled_at, "cityName", "countryId", "eventIds", "createdAt", "updatedAt") FROM stdin;
1	JAMPBQI2023	JAM PBQ I 2023	2023-04-08	2023-04-08	\N	Everett, Washington	US	{333bf,333fm,clock,444bf,555bf,333mbf}	2024-12-03 14:30:27.308	2024-12-03 14:38:24.512
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Event" (id, "wcaId", name, rank) FROM stdin;
\.


--
-- Data for Name: Person; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Person" (id, "wcaUserId", name, "subId", "wcaId", "countryId") FROM stdin;
1	\N	Max Siauw	1	2017SIAU02	US
2	\N	Cailyn Hoover	1	2016HOOV01	US
3	\N	Kevin Matthews	1	2010MATT02	CA
4	\N	Elijah Norman	1	2022NORM03	US
5	\N	Sonja Black	1	2019BLAC02	US
6	\N	Timothy Castle	1	2016CAST48	US
7	\N	Peter Preston	1	2017PRES02	US
8	\N	Ethan Davis	1	2016DAVI02	US
9	\N	Jennifer Castle	1	2020CAST04	US
10	\N	Ethan Ekstrom	1	2018EKST01	SE
\.


--
-- Data for Name: Registration; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Registration" ("competitionId", "personId", "registrantId", "createdAt", "updatedAt", status, "eventIds") FROM stdin;
JAMPBQI2023	1	0	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	2	1	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	3	2	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	4	3	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	5	4	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	6	5	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	7	6	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	8	7	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	9	8	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
JAMPBQI2023	10	9	2024-12-03 14:36:59.197	2024-12-03 14:36:59.197	ACCEPTED	\N
\.


--
-- Data for Name: Result; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Result" (id, "wcaResultId", "personId", "competitionId", "eventId", "roundNumber", pos, best, average, attempts, source, "createdAt", "updatedAt", "registrantId") FROM stdin;
358	\N	1	JAMPBQI2023	333bf	2	\N	-1	-1	{-1,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
359	\N	2	JAMPBQI2023	333bf	2	\N	54018	-1	{54018,-2,-2,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
360	\N	3	JAMPBQI2023	333bf	2	\N	3122	-1	{-1,3122,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
361	\N	4	JAMPBQI2023	333bf	2	\N	24834	-1	{-1,-1,24834,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
362	\N	5	JAMPBQI2023	333bf	2	\N	29111	-1	{29111,31984,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
363	\N	6	JAMPBQI2023	333bf	2	\N	3640	-1	{-1,-1,3640,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
364	\N	7	JAMPBQI2023	333bf	2	\N	12100	-1	{12100,15115,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
365	\N	8	JAMPBQI2023	333bf	2	\N	3144	3589	{3599,3144,4024,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
366	\N	8	JAMPBQI2023	333bf	1	\N	2713	2993	{3130,3135,2713,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
367	\N	4	JAMPBQI2023	333bf	1	\N	18383	-1	{-1,-1,18383,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
368	\N	3	JAMPBQI2023	333bf	1	\N	3994	-1	{3994,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
369	\N	6	JAMPBQI2023	333bf	1	\N	3095	-1	{4070,3095,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
370	\N	7	JAMPBQI2023	333bf	1	\N	11650	-1	{-1,-1,11650,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
371	\N	5	JAMPBQI2023	333bf	1	\N	33177	-1	{33177,-1,-2,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
372	\N	1	JAMPBQI2023	333fm	1	\N	27	2967	{33,29,27,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
373	\N	5	JAMPBQI2023	333fm	1	\N	60	-1	{-2,60,-2,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
374	\N	2	JAMPBQI2023	333fm	1	\N	34	3767	{42,37,34,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
375	\N	3	JAMPBQI2023	333fm	1	\N	33	3600	{38,33,37,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
376	\N	8	JAMPBQI2023	333fm	1	\N	29	3067	{31,29,32,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
377	\N	6	JAMPBQI2023	333fm	1	\N	31	3600	{31,33,44,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
378	\N	7	JAMPBQI2023	333fm	1	\N	35	3833	{43,37,35,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
379	\N	4	JAMPBQI2023	333fm	1	\N	54	5667	{55,54,61,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
380	\N	9	JAMPBQI2023	clock	1	\N	1276	1589	{1276,1434,-1,1564,1768}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
381	\N	6	JAMPBQI2023	clock	1	\N	601	690	{616,736,601,-1,718}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
382	\N	10	JAMPBQI2023	clock	1	\N	1327	1445	{1461,1810,1379,1494,1327}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
383	\N	1	JAMPBQI2023	clock	1	\N	565	699	{728,688,680,565,839}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
384	\N	2	JAMPBQI2023	clock	1	\N	2084	2656	{3006,2619,2084,2343,4826}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
385	\N	7	JAMPBQI2023	clock	1	\N	769	960	{851,892,769,-1,1138}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
386	\N	4	JAMPBQI2023	clock	1	\N	1229	1651	{1633,1503,-1,1816,1229}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
387	\N	6	JAMPBQI2023	444bf	1	\N	32229	-1	{-1,32229,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
388	\N	4	JAMPBQI2023	444bf	1	\N	-1	-1	{-1,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
389	\N	8	JAMPBQI2023	444bf	1	\N	46745	-1	{-1,-1,46745,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
390	\N	3	JAMPBQI2023	444bf	1	\N	23980	-1	{25176,23980,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
391	\N	1	JAMPBQI2023	444bf	1	\N	43052	-1	{-1,-1,43052,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
392	\N	7	JAMPBQI2023	444bf	1	\N	-1	-1	{-1,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
393	\N	3	JAMPBQI2023	555bf	1	\N	-1	-1	{-1,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
394	\N	1	JAMPBQI2023	555bf	1	\N	-1	-1	{-1,-1,-1,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
395	\N	8	JAMPBQI2023	555bf	1	\N	119500	-1	{-1,-1,119500,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
396	\N	6	JAMPBQI2023	555bf	1	\N	96300	-1	{96300,-1,-2,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
397	\N	5	JAMPBQI2023	333mbf	1	\N	980160201	0	{980160201,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
398	\N	8	JAMPBQI2023	333mbf	1	\N	960360017	0	{960360017,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
399	\N	7	JAMPBQI2023	333mbf	1	\N	930299000	0	{930299000,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
400	\N	1	JAMPBQI2023	333mbf	1	\N	900338603	0	{900338603,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
401	\N	6	JAMPBQI2023	333mbf	1	\N	940298304	0	{940298304,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
402	\N	4	JAMPBQI2023	333mbf	1	\N	970208801	0	{970208801,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
403	\N	3	JAMPBQI2023	333mbf	1	\N	800360008	0	{800360008,0,0,0,0}	WCA_OFFICIAL	2024-12-03 14:36:59.227	2024-12-03 14:36:59.227	\N
\.


--
-- Data for Name: Round; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Round" ("competitionId", "eventId", number, type, "createdAt", "updatedAt", "formatId") FROM stdin;
JAMPBQI2023	333bf	1	FINAL	2024-12-03 14:30:27.328	2024-12-03 14:38:24.526	3
JAMPBQI2023	333bf	2	FIRST_ROUND	2024-12-03 14:30:27.333	2024-12-03 14:38:24.529	3
JAMPBQI2023	333fm	1	FINAL	2024-12-03 14:30:27.336	2024-12-03 14:38:24.532	m
JAMPBQI2023	clock	1	FINAL	2024-12-03 14:30:27.34	2024-12-03 14:38:24.535	a
JAMPBQI2023	444bf	1	FINAL	2024-12-03 14:30:27.344	2024-12-03 14:38:24.538	3
JAMPBQI2023	555bf	1	FINAL	2024-12-03 14:30:27.347	2024-12-03 14:38:24.54	3
JAMPBQI2023	333mbf	1	FINAL	2024-12-03 14:30:27.351	2024-12-03 14:38:24.543	1
\.


--
-- Data for Name: _PersonCompetitions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."_PersonCompetitions" ("A", "B") FROM stdin;
\.


--
-- Name: Competition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Competition_id_seq"', 11, true);


--
-- Name: Event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Event_id_seq"', 1, false);


--
-- Name: Person_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Person_id_seq"', 110, true);


--
-- Name: Person_subId_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Person_subId_seq"', 1, false);


--
-- Name: Result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Result_id_seq"', 449, true);


--
-- Name: Competition Competition_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Competition"
    ADD CONSTRAINT "Competition_pkey" PRIMARY KEY ("wcaId");


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Person Person_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Person"
    ADD CONSTRAINT "Person_pkey" PRIMARY KEY (id);


--
-- Name: Registration Registration_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_pkey" PRIMARY KEY ("competitionId", "personId");


--
-- Name: Result Result_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (id);


--
-- Name: Round Round_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Round"
    ADD CONSTRAINT "Round_pkey" PRIMARY KEY ("competitionId", "eventId", number);


--
-- Name: _PersonCompetitions _PersonCompetitions_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_PersonCompetitions"
    ADD CONSTRAINT "_PersonCompetitions_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: Competition_wcaId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Competition_wcaId_key" ON public."Competition" USING btree ("wcaId");


--
-- Name: Event_wcaId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Event_wcaId_key" ON public."Event" USING btree ("wcaId");


--
-- Name: Person_wcaId_subId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Person_wcaId_subId_key" ON public."Person" USING btree ("wcaId", "subId");


--
-- Name: Person_wcaUserId_subId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Person_wcaUserId_subId_key" ON public."Person" USING btree ("wcaUserId", "subId");


--
-- Name: Registration_competitionId_registrantId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Registration_competitionId_registrantId_key" ON public."Registration" USING btree ("competitionId", "registrantId");


--
-- Name: Result_personId_competitionId_eventId_roundNumber_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Result_personId_competitionId_eventId_roundNumber_key" ON public."Result" USING btree ("personId", "competitionId", "eventId", "roundNumber");


--
-- Name: Result_wcaResultId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Result_wcaResultId_key" ON public."Result" USING btree ("wcaResultId");


--
-- Name: Round_competitionId_eventId_type_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Round_competitionId_eventId_type_key" ON public."Round" USING btree ("competitionId", "eventId", type);


--
-- Name: _PersonCompetitions_B_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "_PersonCompetitions_B_index" ON public."_PersonCompetitions" USING btree ("B");


--
-- Name: Registration Registration_competitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES public."Competition"("wcaId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Registration Registration_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Registration"
    ADD CONSTRAINT "Registration_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_competitionId_eventId_roundNumber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_competitionId_eventId_roundNumber_fkey" FOREIGN KEY ("competitionId", "eventId", "roundNumber") REFERENCES public."Round"("competitionId", "eventId", number) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_competitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES public."Competition"("wcaId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_registrantId_competitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_registrantId_competitionId_fkey" FOREIGN KEY ("registrantId", "competitionId") REFERENCES public."Registration"("registrantId", "competitionId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Round Round_competitionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Round"
    ADD CONSTRAINT "Round_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES public."Competition"("wcaId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _PersonCompetitions _PersonCompetitions_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_PersonCompetitions"
    ADD CONSTRAINT "_PersonCompetitions_A_fkey" FOREIGN KEY ("A") REFERENCES public."Competition"("wcaId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PersonCompetitions _PersonCompetitions_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_PersonCompetitions"
    ADD CONSTRAINT "_PersonCompetitions_B_fkey" FOREIGN KEY ("B") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

