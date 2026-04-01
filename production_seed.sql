--
-- PostgreSQL database dump
--

\restrict pNUF3FMexkheqM6oA9BlZbi7GMHxu1xUD6Bt4qhW9t0W5Pe9y098j9NUsLkR5fj

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

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
-- Data for Name: Levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Levels" ("Id", "Name", "Difficulty", "Rows", "Columns", "IsValidated", "IsPublished", "CreatedAt", "UpdatedAt", "OrderIndex") FROM stdin;
12	Level 02	Easy	18	30	f	t	2026-03-27 20:23:45.244706-07	2026-03-31 21:36:43.20283-07	1
13	Level 01	Easy	20	30	f	t	2026-03-28 16:11:44.511341-07	2026-03-31 21:36:43.201714-07	0
9	Level 08	Hard	20	28	f	t	2026-03-27 19:51:34.140018-07	2026-03-31 21:37:32.350551-07	7
8	Level 03	Easy	23	12	f	t	2026-03-27 19:42:08.037707-07	2026-03-31 21:37:39.154923-07	2
11	Level 04	Medium	20	28	f	t	2026-03-27 20:07:21.27029-07	2026-03-31 21:37:48.118242-07	3
7	Level 05	Medium	15	28	f	t	2026-03-27 19:27:53.272764-07	2026-03-31 21:37:55.678056-07	4
15	Level 06	Medium	15	26	f	t	2026-03-31 20:07:35.388943-07	2026-03-31 21:38:01.400262-07	5
10	Level 07	Hard	20	24	f	t	2026-03-27 20:06:57.948844-07	2026-03-31 21:38:19.791711-07	6
\.


--
-- Data for Name: GameObjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GameObjects" ("Id", "X", "Y", "Width", "Height", "ObjectType", "LevelId", "RequiredKeyColor", "Barrier_IsUnlocked", "IsActivated", "TargetObjectType", "IsUnlocked", "HazardType", "Color", "IsCollected", "Rotation") FROM stdin;
1315	2	1	1	2	Barrier	7	White	f	\N	\N	\N	\N	\N	\N	0
1316	1	0	2	1	Barrier	7	White	f	\N	\N	\N	\N	\N	\N	0
1317	23	3	4	1	Barrier	7	Red	f	\N	\N	\N	\N	\N	\N	0
1318	1	1	1	2	ExitDoor	7	\N	\N	\N	\N	f	\N	\N	\N	0
1319	4	1	1	1	Hazard	7	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1320	23	7	4	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1321	26	6	1	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1322	17	3	6	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1323	17	4	1	2	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1324	14	4	3	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1325	14	5	3	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1326	13	4	1	2	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1327	11	3	3	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1328	11	4	1	2	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1329	8	4	3	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1330	8	5	3	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1331	7	4	1	2	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1332	1	3	7	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1333	17	9	4	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1334	10	11	4	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1335	3	9	4	1	Hazard	7	\N	\N	\N	\N	\N	Platform	\N	\N	0
1424	23	0	2	1	Barrier	15	White	f	\N	\N	\N	\N	\N	\N	0
1425	23	1	1	2	Barrier	15	White	f	\N	\N	\N	\N	\N	\N	0
1426	1	5	3	1	Barrier	15	Red	f	\N	\N	\N	\N	\N	\N	0
1427	24	1	1	2	ExitDoor	15	\N	\N	\N	\N	f	\N	\N	\N	0
1428	2	12	1	1	Hazard	15	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1429	5	13	2	1	Hazard	15	\N	\N	\N	\N	\N	Spike	\N	\N	0
1430	10	13	2	1	Hazard	15	\N	\N	\N	\N	\N	Spike	\N	\N	0
1431	15	13	2	1	Hazard	15	\N	\N	\N	\N	\N	Spike	\N	\N	0
1432	20	13	2	1	Hazard	15	\N	\N	\N	\N	\N	Spike	\N	\N	0
1433	24	10	1	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1434	19	8	1	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1435	14	6	1	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1436	9	4	1	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1437	1	8	3	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1438	4	5	1	4	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1439	19	3	6	1	Hazard	15	\N	\N	\N	\N	\N	Platform	\N	\N	0
1440	22	1	1	1	Key	15	\N	\N	\N	\N	\N	\N	Red	f	0
1441	2	6	1	1	Key	15	\N	\N	\N	\N	\N	\N	White	f	0
1495	12	3	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	0
1496	1	13	7	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1497	1	5	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	90
1498	1	6	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	90
1499	1	7	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	90
1500	3	12	1	1	Hazard	10	\N	\N	\N	\N	\N	KillBrick	\N	\N	0
1501	15	18	6	1	Hazard	10	\N	\N	\N	\N	\N	KillBrick	\N	\N	0
1502	10	11	5	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1503	9	18	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	0
1293	2	1	1	2	Barrier	11	White	f	\N	\N	\N	\N	\N	\N	0
1294	1	0	2	1	Barrier	11	White	f	\N	\N	\N	\N	\N	\N	0
1295	22	16	1	3	Barrier	11	Red	f	\N	\N	\N	\N	\N	\N	0
1296	2	8	1	3	Barrier	11	Blue	f	\N	\N	\N	\N	\N	\N	0
1297	1	7	2	1	Barrier	11	Blue	f	\N	\N	\N	\N	\N	\N	0
1298	1	1	1	2	ExitDoor	11	\N	\N	\N	\N	f	\N	\N	\N	0
1299	2	17	1	1	Hazard	11	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1300	1	11	5	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1301	22	15	5	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1302	22	7	5	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1336	1	13	8	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1337	9	13	8	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1338	17	13	8	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1339	25	13	2	1	Hazard	7	\N	\N	\N	\N	\N	Spike	\N	\N	0
1340	25	1	1	1	Key	7	\N	\N	\N	\N	\N	\N	Red	f	0
1341	3	7	1	1	Key	7	\N	\N	\N	\N	\N	\N	White	f	0
1504	16	1	1	1	Key	10	\N	\N	\N	\N	\N	\N	Red	f	0
1505	1	17	1	1	Key	10	\N	\N	\N	\N	\N	\N	White	f	0
1506	7	14	1	1	Key	10	\N	\N	\N	\N	\N	\N	Blue	f	0
1507	22	5	1	1	Key	10	\N	\N	\N	\N	\N	\N	Green	f	0
1508	22	15	1	1	Key	10	\N	\N	\N	\N	\N	\N	Purple	f	0
1509	1	10	1	1	Key	10	\N	\N	\N	\N	\N	\N	Yellow	f	0
1442	9	20	1	2	Barrier	8	White	f	\N	\N	\N	\N	\N	\N	0
1443	9	19	2	1	Barrier	8	White	f	\N	\N	\N	\N	\N	\N	0
1444	10	20	1	2	ExitDoor	8	\N	\N	\N	\N	f	\N	\N	\N	0
1445	1	15	3	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1446	8	18	3	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1447	8	12	2	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1448	2	9	2	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1449	8	6	1	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1450	2	20	1	1	Hazard	8	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1451	3	3	1	1	Hazard	8	\N	\N	\N	\N	\N	Platform	\N	\N	0
1452	3	1	1	1	Key	8	\N	\N	\N	\N	\N	\N	White	f	0
1453	12	8	1	2	Barrier	9	White	f	\N	\N	\N	\N	\N	\N	0
1454	14	8	1	2	Barrier	9	White	f	\N	\N	\N	\N	\N	\N	0
1455	12	7	3	1	Barrier	9	White	f	\N	\N	\N	\N	\N	\N	0
1456	25	2	2	1	Barrier	9	Red	f	\N	\N	\N	\N	\N	\N	0
1457	25	3	1	3	Barrier	9	Red	f	\N	\N	\N	\N	\N	\N	0
1458	13	8	1	2	ExitDoor	9	\N	\N	\N	\N	f	\N	\N	\N	0
1459	11	10	5	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1460	22	6	5	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1461	2	17	1	1	Hazard	9	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1462	1	15	8	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1463	9	15	8	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1464	17	15	6	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1465	23	15	1	1	Hazard	9	\N	\N	\N	\N	\N	KillBrick	\N	\N	270
1466	21	6	1	1	Hazard	9	\N	\N	\N	\N	\N	KillBrick	\N	\N	90
1467	12	2	8	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1468	1	5	8	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1469	8	11	1	1	Hazard	9	\N	\N	\N	\N	\N	KillBrick	\N	\N	270
1470	1	11	7	1	Hazard	9	\N	\N	\N	\N	\N	Platform	\N	\N	0
1471	11	2	1	1	Hazard	9	\N	\N	\N	\N	\N	KillBrick	\N	\N	90
1472	26	3	1	1	Key	9	\N	\N	\N	\N	\N	\N	White	f	0
1473	15	8	1	1	Key	9	\N	\N	\N	\N	\N	\N	Red	f	0
464	27	3	1	2	Barrier	13	White	f	\N	\N	\N	\N	\N	\N	0
465	27	2	2	1	Barrier	13	White	f	\N	\N	\N	\N	\N	\N	0
466	9	15	4	1	Barrier	13	Red	f	\N	\N	\N	\N	\N	\N	0
467	28	3	1	2	ExitDoor	13	\N	\N	\N	\N	f	\N	\N	\N	0
468	24	5	5	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
469	24	5	5	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
470	11	12	8	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
471	18	8	4	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
472	21	15	8	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
473	13	15	8	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
474	1	15	8	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
475	4	9	5	1	Hazard	13	\N	\N	\N	\N	\N	Platform	\N	\N	0
476	2	17	1	1	Hazard	13	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
477	28	16	1	1	Key	13	\N	\N	\N	\N	\N	\N	Red	f	0
478	4	7	1	1	Key	13	\N	\N	\N	\N	\N	\N	White	f	0
613	27	1	1	2	Barrier	12	White	f	\N	\N	\N	\N	\N	\N	0
614	27	0	2	1	Barrier	12	White	f	\N	\N	\N	\N	\N	\N	0
615	14	9	1	4	Barrier	12	Red	f	\N	\N	\N	\N	\N	\N	0
616	28	1	1	2	ExitDoor	12	\N	\N	\N	\N	f	\N	\N	\N	0
617	2	15	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
618	10	13	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
619	18	11	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
620	2	15	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
621	18	11	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
622	16	16	1	1	Hazard	12	\N	\N	\N	\N	\N	Spike	\N	\N	0
623	24	3	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
624	2	13	1	1	Hazard	12	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
625	24	16	1	1	Hazard	12	\N	\N	\N	\N	\N	Spike	\N	\N	0
626	10	8	5	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
627	5	8	1	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
628	1	8	1	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
629	19	5	3	1	Hazard	12	\N	\N	\N	\N	\N	Platform	\N	\N	0
630	28	14	1	1	Key	12	\N	\N	\N	\N	\N	\N	Red	f	0
631	1	5	1	1	Key	12	\N	\N	\N	\N	\N	\N	White	f	0
1474	21	2	1	2	Barrier	10	White	f	\N	\N	\N	\N	\N	\N	0
1475	21	1	2	1	Barrier	10	White	f	\N	\N	\N	\N	\N	\N	0
1476	20	1	1	3	Barrier	10	Purple	f	\N	\N	\N	\N	\N	\N	0
1303	1	3	5	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1304	6	18	2	1	Hazard	11	\N	\N	\N	\N	\N	KillBrick	\N	\N	0
1305	12	18	2	1	Hazard	11	\N	\N	\N	\N	\N	KillBrick	\N	\N	0
1306	18	18	2	1	Hazard	11	\N	\N	\N	\N	\N	KillBrick	\N	\N	0
1307	24	16	1	1	Hazard	11	\N	\N	\N	\N	\N	Spike	\N	\N	180
1308	8	7	3	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1309	15	5	3	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1310	15	13	3	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1311	9	12	3	1	Hazard	11	\N	\N	\N	\N	\N	Platform	\N	\N	0
1312	26	16	1	1	Key	11	\N	\N	\N	\N	\N	\N	White	f	0
1313	1	8	1	1	Key	11	\N	\N	\N	\N	\N	\N	Red	f	0
1314	26	4	1	1	Key	11	\N	\N	\N	\N	\N	\N	Blue	f	0
1477	20	0	3	1	Barrier	10	Purple	f	\N	\N	\N	\N	\N	\N	0
1478	19	0	1	4	Barrier	10	Yellow	f	\N	\N	\N	\N	\N	\N	0
1479	18	0	1	4	Barrier	10	Green	f	\N	\N	\N	\N	\N	\N	0
1480	17	0	1	4	Barrier	10	Blue	f	\N	\N	\N	\N	\N	\N	0
1481	5	4	4	1	Barrier	10	Red	f	\N	\N	\N	\N	\N	\N	0
1482	18	5	1	3	Barrier	10	Blue	f	\N	\N	\N	\N	\N	\N	0
1483	2	17	1	2	Barrier	10	Green	f	\N	\N	\N	\N	\N	\N	0
1484	1	16	2	1	Barrier	10	Green	f	\N	\N	\N	\N	\N	\N	0
1485	5	9	1	4	Barrier	10	Purple	f	\N	\N	\N	\N	\N	\N	0
1486	22	2	1	2	ExitDoor	10	\N	\N	\N	\N	f	\N	\N	\N	0
1487	17	4	6	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1488	9	4	8	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1489	1	4	4	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1490	2	2	1	1	Hazard	10	\N	\N	\N	\N	\N	SpawnPoint	\N	\N	0
1491	1	8	5	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1492	18	8	5	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1493	15	15	5	1	Hazard	10	\N	\N	\N	\N	\N	Platform	\N	\N	0
1494	11	3	1	1	Hazard	10	\N	\N	\N	\N	\N	Spike	\N	\N	0
\.


--
-- Name: GameObjects_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."GameObjects_Id_seq"', 1509, true);


--
-- Name: Levels_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Levels_Id_seq"', 15, true);


--
-- PostgreSQL database dump complete
--

\unrestrict pNUF3FMexkheqM6oA9BlZbi7GMHxu1xUD6Bt4qhW9t0W5Pe9y098j9NUsLkR5fj

