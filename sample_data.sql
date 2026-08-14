SET search_path TO book_the_game;

-- =========================================================
-- Phase 2 Sample Data
-- Note: roles has only 2 valid rows by design constraint.
-- Other lookup/main tables include 10+ rows where the model allows it.
-- =========================================================

INSERT INTO roles (role_id, role_name) VALUES
(1, 'spectator'),
(2, 'support');

INSERT INTO provinces (province_id, name) VALUES
(1, 'Tehran'),
(2, 'Isfahan'),
(3, 'Fars'),
(4, 'Khorasan Razavi'),
(5, 'East Azerbaijan'),
(6, 'Khuzestan'),
(7, 'Gilan'),
(8, 'Mazandaran'),
(9, 'Yazd'),
(10, 'Alborz');

INSERT INTO cities (city_id, province_id, name) VALUES
(1, 1, 'Tehran'),
(2, 1, 'Rey'),
(3, 2, 'Isfahan'),
(4, 3, 'Shiraz'),
(5, 4, 'Mashhad'),
(6, 5, 'Tabriz'),
(7, 6, 'Ahvaz'),
(8, 7, 'Rasht'),
(9, 8, 'Sari'),
(10, 9, 'Yazd'),
(11, 10, 'Karaj'),
(12, 1, 'Shemiranat');

INSERT INTO users (user_id, role_id, city_id, first_name, last_name, email, phone, password_hash, status, registered_at) VALUES
(1, 1, 1, 'Ali', 'Ahmadi', 'ali.ahmadi@example.com', '09120000001', 'hash_1', 'active', '2025-01-10 09:00:00'),
(2, 1, 1, 'Reza', 'Karimi', 'reza.karimi@example.com', '09120000002', 'hash_2', 'active', '2025-02-05 10:00:00'),
(3, 1, 2, 'Mina', 'Mohammadi', 'mina.mohammadi@example.com', '09120000003', 'hash_3', 'active', '2025-03-12 11:00:00'),
(4, 1, 3, 'Sara', 'Hosseini', 'sara.hosseini@example.com', '09120000004', 'hash_4', 'active', '2025-04-18 12:00:00'),
(5, 1, 4, 'Omid', 'Rahimi', 'omid.rahimi@example.com', '09120000005', 'hash_5', 'active', '2025-05-20 13:00:00'),
(6, 1, 5, 'Neda', 'Jafari', 'neda.jafari@example.com', '09120000006', 'hash_6', 'active', '2025-06-22 14:00:00'),
(7, 1, 6, 'Pouya', 'Ebrahimi', 'pouya.ebrahimi@example.com', '09120000007', 'hash_7', 'active', '2025-07-01 15:00:00'),
(8, 1, 7, 'Leila', 'Moradi', 'leila.moradi@example.com', '09120000008', 'hash_8', 'active', '2025-08-03 16:00:00'),
(9, 1, 8, 'Arman', 'Sadeghi', 'arman.sadeghi@example.com', '09120000009', 'hash_9', 'active', '2025-09-07 17:00:00'),
(10, 1, 9, 'Hana', 'Akbari', 'hana.akbari@example.com', '09120000010', 'hash_10', 'active', '2025-10-09 18:00:00'),
(11, 2, 1, 'Support', 'One', 'support1@example.com', '09120000011', 'hash_11', 'active', '2025-01-01 08:00:00'),
(12, 2, 3, 'Support', 'Two', 'support2@example.com', '09120000012', 'hash_12', 'active', '2025-01-02 08:00:00'),
(13, 2, 5, 'Support', 'Three', 'support3@example.com', '09120000013', 'hash_13', 'active', '2025-01-03 08:00:00');

INSERT INTO support_users (user_id, support_role_id) VALUES
(11, 2), (12, 2), (13, 2);

INSERT INTO organizers (organizer_id, city_id, name, email, phone, status) VALUES
(1, 1, 'Azadi Sports Organization', 'azadi.org@example.com', '02144000001', 'active'),
(2, 3, 'Isfahan Arena Events', 'isfahan.events@example.com', '03134000002', 'active'),
(3, 4, 'Shiraz Sports Group', 'shiraz.group@example.com', '07136000003', 'active'),
(4, 5, 'Mashhad Match Makers', 'mashhad.matches@example.com', '05138000004', 'active'),
(5, 6, 'Tabriz Sport Agency', 'tabriz.agency@example.com', '04133000005', 'active'),
(6, 7, 'Ahvaz League Office', 'ahvaz.league@example.com', '06132000006', 'active'),
(7, 8, 'Rasht Event Club', 'rasht.club@example.com', '01331000007', 'active'),
(8, 9, 'Sari Sports Board', 'sari.board@example.com', '01135000008', 'active'),
(9, 10, 'Yazd Tournament Center', 'yazd.center@example.com', '03537000009', 'active'),
(10, 11, 'Karaj Sport House', 'karaj.house@example.com', '02636000010', 'active');

INSERT INTO sport_types (sport_type_id, name) VALUES
(1, 'Football'),
(2, 'Volleyball'),
(3, 'Basketball'),
(4, 'Futsal'),
(5, 'Handball'),
(6, 'Tennis'),
(7, 'Wrestling'),
(8, 'Swimming'),
(9, 'Athletics'),
(10, 'Badminton');

INSERT INTO teams (team_id, sport_type_id, city_id, name) VALUES
(1, 1, 1, 'Persepolis'),
(2, 1, 1, 'Esteghlal'),
(3, 1, 3, 'Sepahan'),
(4, 1, 6, 'Tractor'),
(5, 2, 5, 'Paykan Volleyball'),
(6, 2, 3, 'Sepahan Volleyball'),
(7, 2, 4, 'Shiraz Volleyball'),
(8, 2, 8, 'Rasht Volleyball'),
(9, 3, 1, 'Mahram Basketball'),
(10, 3, 3, 'Zob Ahan Basketball'),
(11, 3, 7, 'Ahvaz Basketball'),
(12, 3, 11, 'Karaj Basketball'),
(13, 4, 1, 'Tehran Futsal'),
(14, 4, 5, 'Mashhad Futsal'),
(15, 5, 6, 'Tabriz Handball'),
(16, 5, 10, 'Yazd Handball'),
(17, 6, 1, 'Tehran Tennis Club'),
(18, 6, 3, 'Isfahan Tennis Club'),
(19, 7, 8, 'Gilan Wrestling'),
(20, 7, 9, 'Mazandaran Wrestling');

INSERT INTO venues (venue_id, city_id, name, address, venue_type) VALUES
(1, 1, 'Azadi Stadium', 'Tehran, Azadi Complex', 'stadium'),
(2, 1, 'Enghelab Hall', 'Tehran, Enghelab Complex', 'hall'),
(3, 3, 'Naghsh-e Jahan Stadium', 'Isfahan', 'stadium'),
(4, 4, 'Hafezieh Stadium', 'Shiraz', 'stadium'),
(5, 5, 'Imam Reza Stadium', 'Mashhad', 'stadium'),
(6, 6, 'Yadegar Arena', 'Tabriz', 'arena'),
(7, 7, 'Takhti Ahvaz Stadium', 'Ahvaz', 'stadium'),
(8, 8, 'Rasht Sports Hall', 'Rasht', 'hall'),
(9, 10, 'Yazd Central Hall', 'Yazd', 'hall'),
(10, 11, 'Karaj Arena', 'Karaj', 'arena');

INSERT INTO competitions (competition_id, sport_type_id, name) VALUES
(1, 1, 'Persian Gulf Pro League'),
(2, 1, 'Hazfi Cup'),
(3, 2, 'Iran Volleyball Super League'),
(4, 2, 'Volleyball National Cup'),
(5, 3, 'Iran Basketball Super League'),
(6, 3, 'Basketball National Cup'),
(7, 4, 'Futsal Premier League'),
(8, 5, 'Handball League'),
(9, 6, 'Tennis Open Cup'),
(10, 7, 'Wrestling Grand Prix');

INSERT INTO matches (match_id, sport_type_id, competition_id, organizer_id, home_team_id, away_team_id, venue_id, match_datetime, status) VALUES
(1, 1, 1, 1, 1, 2, 1, CURRENT_TIMESTAMP + INTERVAL '7 days', 'scheduled'),
(2, 1, 1, 2, 3, 4, 3, CURRENT_TIMESTAMP + INTERVAL '10 days', 'scheduled'),
(3, 2, 3, 4, 5, 6, 5, CURRENT_TIMESTAMP + INTERVAL '13 days', 'scheduled'),
(4, 2, 4, 7, 7, 8, 8, CURRENT_TIMESTAMP + INTERVAL '16 days', 'scheduled'),
(5, 3, 5, 1, 9, 10, 2, CURRENT_TIMESTAMP + INTERVAL '19 days', 'scheduled'),
(6, 3, 6, 6, 11, 12, 7, CURRENT_TIMESTAMP + INTERVAL '22 days', 'scheduled'),
(7, 4, 7, 4, 13, 14, 5, CURRENT_TIMESTAMP + INTERVAL '25 days', 'scheduled'),
(8, 5, 8, 5, 15, 16, 6, CURRENT_TIMESTAMP + INTERVAL '28 days', 'scheduled'),
(9, 6, 9, 2, 17, 18, 3, CURRENT_TIMESTAMP + INTERVAL '31 days', 'scheduled'),
(10, 7, 10, 8, 19, 20, 10, CURRENT_TIMESTAMP + INTERVAL '34 days', 'scheduled');

INSERT INTO ticket_categories (category_id, name, description) VALUES
(1, 'Normal', 'Regular ticket category'),
(2, 'Special', 'Special ticket category'),
(3, 'VIP', 'VIP ticket category'),
(4, 'Family', 'Family section ticket'),
(5, 'Student', 'Discounted student ticket'),
(6, 'Economy', 'Low price ticket'),
(7, 'Premium', 'Premium view ticket'),
(8, 'Accessible', 'Accessible seating ticket'),
(9, 'Media', 'Media section ticket'),
(10, 'Guest', 'Guest allocation ticket');

INSERT INTO seats (seat_id, venue_id, section_name, row_number, seat_number) VALUES
(1,1,'A','1','1'),(2,1,'A','1','2'),(3,1,'A','1','3'),(4,1,'VIP','1','1'),(5,1,'VIP','1','2'),
(6,2,'B','1','1'),(7,2,'B','1','2'),(8,2,'VIP','1','1'),
(9,3,'C','1','1'),(10,3,'C','1','2'),(11,3,'VIP','1','1'),
(12,4,'D','1','1'),(13,4,'D','1','2'),
(14,5,'E','1','1'),(15,5,'E','1','2'),(16,5,'VIP','1','1'),
(17,6,'F','1','1'),(18,6,'F','1','2'),
(19,7,'G','1','1'),(20,7,'G','1','2'),
(21,8,'H','1','1'),(22,8,'H','1','2'),
(23,9,'I','1','1'),(24,9,'I','1','2'),
(25,10,'J','1','1'),(26,10,'J','1','2'),(27,10,'VIP','1','1'),
(28,3,'C','2','1'),(29,5,'E','2','1'),(30,7,'G','2','1'),(31,8,'H','2','1'),(32,2,'B','2','1');

INSERT INTO tickets (ticket_id, match_id, venue_id, category_id, seat_id, price, status, created_at) VALUES
(1,1,1,1,1,500000,'sold','2026-06-01'),(2,1,1,1,2,500000,'sold','2026-06-01'),(3,1,1,3,4,1500000,'sold','2026-06-01'),(4,1,1,3,5,1500000,'sold','2026-06-01'),
(5,2,3,1,9,450000,'sold','2026-06-02'),(6,2,3,1,10,450000,'sold','2026-06-02'),(7,2,3,3,11,1200000,'sold','2026-06-02'),(8,2,3,2,28,750000,'available','2026-06-02'),
(9,3,5,1,14,300000,'sold','2026-06-03'),(10,3,5,2,15,550000,'sold','2026-06-03'),(11,3,5,3,16,900000,'available','2026-06-03'),(12,3,5,1,29,300000,'available','2026-06-03'),
(13,4,8,1,21,280000,'sold','2026-06-04'),(14,4,8,2,22,500000,'available','2026-06-04'),
(15,5,2,1,6,350000,'sold','2026-06-05'),(16,5,2,1,7,350000,'sold','2026-06-05'),(17,5,2,3,8,950000,'sold','2026-06-05'),
(18,6,7,1,19,320000,'sold','2026-06-06'),(19,6,7,2,20,600000,'available','2026-06-06'),(20,6,7,1,30,320000,'available','2026-06-06'),
(21,7,5,1,14,250000,'available','2026-06-07'),(22,7,5,2,15,450000,'available','2026-06-07'),
(23,8,6,1,17,220000,'sold','2026-06-08'),(24,8,6,2,18,400000,'available','2026-06-08'),
(25,9,3,1,9,200000,'sold','2026-06-09'),(26,9,3,2,10,380000,'available','2026-06-09'),
(27,10,10,1,25,180000,'available','2026-06-10'),(28,10,10,1,26,180000,'available','2026-06-10'),(29,10,10,3,27,700000,'available','2026-06-10'),
(30,4,8,1,31,280000,'available','2026-06-10'),
(31,5,2,2,32,600000,'available','2026-06-10');

INSERT INTO orders (order_id, user_id, status, reserved_at, reserved_until) VALUES
(1,1,'paid','2026-06-20 09:00','2026-06-20 09:10'),
(2,2,'paid','2026-06-21 10:00','2026-06-21 10:10'),
(3,3,'paid','2026-06-22 11:00','2026-06-22 11:10'),
(4,4,'paid','2026-06-23 12:00','2026-06-23 12:10'),
(5,5,'paid','2026-06-24 13:00','2026-06-24 13:10'),
(6,6,'paid','2026-06-25 14:00','2026-06-25 14:10'),
(7,7,'paid','2026-06-26 15:00','2026-06-26 15:10'),
(8,8,'paid','2026-06-27 16:00','2026-06-27 16:10'),
(9,9,'partially_cancelled','2026-06-28 17:00','2026-06-28 17:10'),
(10,10,'cancelled','2026-06-29 18:00','2026-06-29 18:10'),
(11,1,'paid','2026-06-28 20:00','2026-06-28 20:10'),
(12,2,'paid','2026-06-29 21:00','2026-06-29 21:10');

INSERT INTO reservations (reservation_id, order_id, ticket_id, status, price_at_reservation, created_at, cancelled_at) VALUES
(1,1,1,'paid',500000,'2026-06-20 09:00',NULL),(2,1,2,'paid',500000,'2026-06-20 09:00',NULL),(3,1,3,'paid',1500000,'2026-06-20 09:00',NULL),
(4,2,5,'paid',450000,'2026-06-21 10:00',NULL),(5,2,6,'paid',450000,'2026-06-21 10:00',NULL),
(6,3,9,'paid',300000,'2026-06-22 11:00',NULL),(7,3,10,'paid',550000,'2026-06-22 11:00',NULL),
(8,4,13,'paid',280000,'2026-06-23 12:00',NULL),
(9,5,15,'paid',350000,'2026-06-24 13:00',NULL),(10,5,16,'paid',350000,'2026-06-24 13:00',NULL),
(11,6,17,'paid',950000,'2026-06-25 14:00',NULL),
(12,7,18,'paid',320000,'2026-06-26 15:00',NULL),
(13,8,23,'paid',220000,'2026-06-27 16:00',NULL),
(14,9,25,'paid',200000,'2026-06-28 17:00',NULL),(15,9,27,'cancelled',180000,'2026-06-28 17:00','2026-06-29 09:00'),
(16,10,28,'cancelled',180000,'2026-06-29 18:00','2026-06-29 19:00'),
(17,11,4,'paid',1500000,'2026-06-28 20:00',NULL),
(18,12,7,'paid',1200000,'2026-06-29 21:00',NULL);

INSERT INTO payments (payment_id, order_id, amount, method, status, paid_at, transaction_code) VALUES
(1,1,2500000,'bank_card','success','2026-06-20 09:04','TX-0001'),
(2,2,900000,'wallet','success','2026-06-21 10:05','TX-0002'),
(3,3,850000,'bank_card','success','2026-06-22 11:04','TX-0003'),
(4,4,280000,'bank_card','success','2026-06-23 12:02','TX-0004'),
(5,5,700000,'wallet','success','2026-06-24 13:03','TX-0005'),
(6,6,950000,'bank_card','success','2026-06-25 14:04','TX-0006'),
(7,7,320000,'crypto','success','2026-06-26 15:06','TX-0007'),
(8,8,220000,'bank_card','success','2026-06-27 16:03','TX-0008'),
(9,9,380000,'wallet','success','2026-06-28 17:02','TX-0009'),
(10,10,180000,'bank_card','refunded','2026-06-29 18:04','TX-0010'),
(11,11,1500000,'bank_card','success','2026-06-28 20:03','TX-0011'),
(12,12,1200000,'bank_card','success','2026-06-29 21:03','TX-0012');

INSERT INTO cancellation_policies (policy_id, organizer_id, sport_type_id, name, status) VALUES
(1,1,1,'Azadi Football Policy','active'),(2,2,1,'Isfahan Football Policy','active'),(3,4,2,'Mashhad Volleyball Policy','active'),(4,7,2,'Rasht Volleyball Policy','active'),(5,1,3,'Azadi Basketball Policy','active'),
(6,6,3,'Ahvaz Basketball Policy','active'),(7,4,4,'Mashhad Futsal Policy','active'),(8,5,5,'Tabriz Handball Policy','active'),(9,2,6,'Isfahan Tennis Policy','active'),(10,8,7,'Sari Wrestling Policy','active');

INSERT INTO cancellation_policy_rules (rule_id, policy_id, min_hours_before_match, max_hours_before_match, penalty_percent) VALUES
(1,1,0,24,50),(2,1,24,NULL,10),(3,2,0,24,40),(4,2,24,NULL,10),(5,3,0,24,35),(6,3,24,NULL,5),(7,4,0,24,35),(8,4,24,NULL,5),(9,5,0,24,45),(10,5,24,NULL,10),
(11,6,0,24,45),(12,6,24,NULL,10),(13,7,0,24,30),(14,7,24,NULL,5),(15,8,0,24,30),(16,8,24,NULL,5),(17,9,0,24,20),(18,9,24,NULL,0),(19,10,0,24,25),(20,10,24,NULL,5);

INSERT INTO cancellation_requests (request_id, order_id, user_id, request_type, reason, status, requested_at, reviewed_by_support_id, reviewed_at) VALUES
(1,9,9,'single_ticket','User cannot attend one event','approved','2026-06-29 08:30',11,'2026-06-29 09:00'),
(2,10,10,'whole_order','Travel issue','approved','2026-06-29 18:30',12,'2026-06-29 19:00'),
(3,1,1,'change_seat','Wants VIP row change','pending','2026-06-29 10:00',NULL,NULL),
(4,2,2,'single_ticket','Seat problem','rejected','2026-06-29 11:00',13,'2026-06-29 11:30'),
(5,3,3,'single_ticket','Payment concern','pending','2026-06-29 12:00',NULL,NULL),
(6,4,4,'whole_order','Schedule conflict','pending','2026-06-29 13:00',NULL,NULL),
(7,5,5,'change_seat','Better view requested','pending','2026-06-29 14:00',NULL,NULL),
(8,6,6,'single_ticket','Unexpected issue','pending','2026-06-29 15:00',NULL,NULL),
(9,7,7,'single_ticket','Cannot attend','pending','2026-06-29 16:00',NULL,NULL),
(10,8,8,'whole_order','Family plan changed','pending','2026-06-29 17:00',NULL,NULL);

INSERT INTO cancellation_request_items (request_id, order_id, request_type, reservation_id, ticket_id, match_id, item_action, requested_new_ticket_id, policy_id, policy_rule_id, organizer_id, sport_type_id, penalty_percent_applied, refund_amount, status) VALUES
(1,9,'single_ticket',15,27,10,'cancel',NULL,10,20,8,7,5,171000,'approved'),
(2,10,'whole_order',16,28,10,'cancel',NULL,10,20,8,7,5,171000,'approved'),
(3,1,'change_seat',1,1,1,'change_seat',4,NULL,NULL,NULL,NULL,0,0,'pending'),
(4,2,'single_ticket',4,5,2,'cancel',NULL,2,4,2,1,10,405000,'rejected'),
(5,3,'single_ticket',6,9,3,'cancel',NULL,3,6,4,2,5,285000,'pending'),
(6,4,'whole_order',8,13,4,'cancel',NULL,4,8,7,2,5,266000,'pending'),
(7,5,'change_seat',9,15,5,'change_seat',31,NULL,NULL,NULL,NULL,0,0,'pending'),
(8,6,'single_ticket',11,17,5,'cancel',NULL,5,10,1,3,10,855000,'pending'),
(9,7,'single_ticket',12,18,6,'cancel',NULL,6,12,6,3,10,288000,'pending'),
(10,8,'whole_order',13,23,8,'cancel',NULL,8,16,5,5,5,209000,'pending');

INSERT INTO refunds (refund_id, payment_id, cancellation_request_id, order_id, amount, status, refunded_at) VALUES
(1,9,1,9,171000,'success','2026-06-29 09:15'),
(2,10,2,10,171000,'success','2026-06-29 19:15'),
(3,3,5,3,285000,'pending',NULL),
(4,4,6,4,266000,'pending',NULL),
(5,6,8,6,855000,'pending',NULL),
(6,7,9,7,288000,'pending',NULL),
(7,8,10,8,209000,'pending',NULL);

INSERT INTO report_categories (report_category_id, name) VALUES
(1, 'Payment Problem'),(2, 'Seat Problem'),(3, 'Unexpected Cancellation'),(4, 'Wrong Ticket Information'),(5, 'Venue Problem'),(6, 'Price Problem'),(7, 'Support Problem'),(8, 'Refund Problem'),(9, 'Match Time Change'),(10, 'Other');

INSERT INTO reports (report_id, user_id, order_id, ticket_id, reservation_id, report_category_id, description, status, created_at, reviewed_by_support_id, reviewed_at) VALUES
(1,1,NULL,1,NULL,2,'Seat label was unclear','pending','2026-06-21 10:00',NULL,NULL),
(2,2,2,NULL,4,1,'Payment receipt delay','reviewed','2026-06-22 10:00',11,'2026-06-22 11:00'),
(3,3,3,NULL,6,4,'Ticket data mismatch','pending','2026-06-23 10:00',NULL,NULL),
(4,4,NULL,13,NULL,5,'Venue gate was crowded','reviewed','2026-06-24 10:00',12,'2026-06-24 11:00'),
(5,5,5,NULL,9,6,'Price looked wrong','pending','2026-06-25 10:00',NULL,NULL),
(6,6,6,NULL,11,8,'Refund question','pending','2026-06-26 10:00',NULL,NULL),
(7,7,NULL,18,NULL,9,'Match time changed','reviewed','2026-06-27 10:00',13,'2026-06-27 11:00'),
(8,8,8,NULL,13,10,'General issue','pending','2026-06-28 10:00',NULL,NULL),
(9,9,9,NULL,15,3,'Cancellation handled late','reviewed','2026-06-29 10:00',11,'2026-06-29 11:00'),
(10,10,10,NULL,16,8,'Refund tracking issue','pending','2026-06-29 20:00',NULL,NULL);

INSERT INTO facilities (facility_id, name) VALUES
(1,'Parking'),(2,'Catering'),(3,'Covered Seat'),(4,'Dedicated Entrance'),(5,'VIP Lounge'),(6,'Family Gate'),(7,'Accessible Path'),(8,'Merchandise Discount'),(9,'Fast Check-in'),(10,'Near Court');

INSERT INTO ticket_facilities (ticket_id, facility_id) VALUES
(1,1),(1,3),(2,1),(3,2),(3,5),(4,2),(4,5),(5,1),(6,1),(7,5),(8,3),(9,10),(10,4),(11,5),(12,10),(13,4),(14,10),(15,10),(16,10),(17,5),(18,3),(19,4),(20,3),(21,10),(22,4),(23,2),(24,3),(25,9),(26,9),(27,5),(28,5),(29,5),(30,4),(31,4);

-- =========================================================
-- Expanded sample data for realistic search and booking tests
-- =========================================================

INSERT INTO provinces (province_id, name) VALUES
(11, 'Qom'),
(12, 'Kerman'),
(13, 'Hormozgan'),
(14, 'Markazi'),
(15, 'Qazvin'),
(16, 'Zanjan'),
(17, 'Golestan'),
(18, 'Ardabil'),
(19, 'Bushehr'),
(20, 'Kurdistan'),
(21, 'Kermanshah'),
(22, 'Lorestan'),
(23, 'Hamadan'),
(24, 'Semnan'),
(25, 'Sistan and Baluchestan'),
(26, 'North Khorasan'),
(27, 'South Khorasan'),
(28, 'Chaharmahal and Bakhtiari'),
(29, 'Kohgiluyeh and Boyer-Ahmad'),
(30, 'Ilam');

INSERT INTO cities (city_id, province_id, name) VALUES
(13,11,'Qom'),(14,12,'Kerman'),(15,13,'Bandar Abbas'),(16,14,'Arak'),
(17,15,'Qazvin'),(18,16,'Zanjan'),(19,17,'Gorgan'),(20,18,'Ardabil'),
(21,19,'Bushehr'),(22,20,'Sanandaj'),(23,21,'Kermanshah'),(24,22,'Khorramabad'),
(25,23,'Hamadan'),(26,24,'Semnan'),(27,25,'Zahedan'),(28,26,'Bojnord'),
(29,27,'Birjand'),(30,28,'Shahrekord'),(31,29,'Yasuj'),(32,30,'Ilam'),
(33,12,'Rafsanjan'),(34,12,'Sirjan'),(35,13,'Kish'),(36,13,'Qeshm'),
(37,14,'Saveh'),(38,15,'Takestan'),(39,16,'Abhar'),(40,17,'Gonbad-e Kavus'),
(41,18,'Meshgin Shahr'),(42,19,'Borazjan'),(43,20,'Saqqez'),(44,21,'Javanrud'),
(45,22,'Borujerd'),(46,23,'Malayer'),(47,24,'Shahroud'),(48,25,'Chabahar'),
(49,26,'Shirvan'),(50,27,'Qaen'),(51,28,'Borujen'),(52,29,'Gachsaran'),
(53,30,'Dehloran'),(54,2,'Kashan'),(55,3,'Marvdasht'),(56,4,'Neyshabur'),
(57,5,'Maragheh'),(58,6,'Abadan'),(59,7,'Anzali'),(60,8,'Amol');

INSERT INTO users (
    user_id, role_id, city_id, first_name, last_name, email, phone,
    password_hash, status, registered_at
)
SELECT
    user_id,
    1,
    1 + mod(user_id * 7, 60),
    (ARRAY['Amir','Maryam','Sina','Zahra','Navid','Parisa','Kian','Mahsa','Arash','Shadi','Milad','Elham'])[1 + mod(user_id, 12)],
    (ARRAY['Azimi','Bahrami','Farhadi','Ghasemi','Heydari','Kazemi','Mousavi','Nouri','Rostami','Shirazi','Taheri','Yousefi'])[1 + mod(user_id * 5, 12)],
    'spectator.' || lpad(user_id::text, 3, '0') || '@example.com',
    '0921' || lpad(user_id::text, 7, '0'),
    'hash_seed_user_' || user_id,
    CASE WHEN mod(user_id, 29) = 0 THEN 'blocked'
         WHEN mod(user_id, 17) = 0 THEN 'inactive'
         ELSE 'active' END,
    CURRENT_TIMESTAMP - make_interval(days => 30 + mod(user_id * 17, 900))
FROM generate_series(14, 130) AS generated(user_id);

INSERT INTO users (
    user_id, role_id, city_id, first_name, last_name, email, phone,
    password_hash, status, registered_at
)
SELECT
    user_id,
    2,
    1 + mod(user_id * 11, 60),
    'Support',
    (ARRAY['Rahimi','Karimi','Ahmadi','Moradi','Jafari','Akbari','Sadeghi','Hosseini'])[1 + mod(user_id, 8)],
    'support' || (user_id - 127) || '@example.com',
    '0935' || lpad((user_id - 127)::text, 7, '0'),
    'hash_seed_support_' || user_id,
    'active',
    CURRENT_TIMESTAMP - make_interval(days => 120 + mod(user_id * 13, 700))
FROM generate_series(131, 147) AS generated(user_id);

INSERT INTO support_users (user_id, support_role_id)
SELECT user_id, 2
FROM generate_series(131, 147) AS generated(user_id);

INSERT INTO organizers (organizer_id, city_id, name, email, phone, status)
SELECT
    organizer_id,
    1 + mod(organizer_id * 13, 60),
    c.name || ' ' ||
        (ARRAY['Championship Office','Community Sports Board','Premier Events','Athletic Association','Tournament Group'])[1 + mod(organizer_id, 5)],
    'organizer.' || lpad(organizer_id::text, 3, '0') || '@events.example.com',
    '0217' || lpad(organizer_id::text, 7, '0'),
    CASE WHEN mod(organizer_id, 19) = 0 THEN 'inactive' ELSE 'active' END
FROM generate_series(11, 100) AS generated(organizer_id)
JOIN cities c ON c.city_id = 1 + mod(organizer_id * 13, 60);

INSERT INTO teams (team_id, sport_type_id, city_id, name)
SELECT
    team_id,
    1 + mod(team_id - 21, 10),
    1 + ((team_id - 21) / 10),
    c.name || ' ' ||
        (ARRAY['Falcons','Pioneers','Stars','United','Guardians','Waves'])[1 + mod((team_id - 21) / 10, 6)] ||
        ' ' || st.name
FROM generate_series(21, 200) AS generated(team_id)
JOIN cities c ON c.city_id = 1 + ((team_id - 21) / 10)
JOIN sport_types st ON st.sport_type_id = 1 + mod(team_id - 21, 10);

INSERT INTO venues (venue_id, city_id, name, address, venue_type)
SELECT
    venue_id,
    1 + mod(venue_id - 11, 60),
    c.name || ' ' ||
        CASE WHEN venue_id <= 70 THEN 'Community Sports Complex'
             ELSE 'Riverside Championship Center' END,
    c.name || ', Sports District ' || (1 + mod(venue_id * 3, 12)),
    (ARRAY['stadium','hall','arena'])[1 + mod(venue_id, 3)]
FROM generate_series(11, 100) AS generated(venue_id)
JOIN cities c ON c.city_id = 1 + mod(venue_id - 11, 60);

INSERT INTO competitions (competition_id, sport_type_id, name)
SELECT
    competition_id,
    1 + mod(competition_id - 11, 10),
    st.name || CASE WHEN competition_id <= 20
        THEN ' National Championship'
        ELSE ' Regional Cup' END
FROM generate_series(11, 30) AS generated(competition_id)
JOIN sport_types st ON st.sport_type_id = 1 + mod(competition_id - 11, 10);

INSERT INTO matches (
    match_id, sport_type_id, competition_id, organizer_id,
    home_team_id, away_team_id, venue_id, match_datetime, status
)
SELECT
    match_id,
    1 + mod(match_id - 11, 10) AS sport_type_id,
    11 + mod(match_id - 11, 10) +
        CASE WHEN mod((match_id - 11) / 10, 2) = 1 THEN 10 ELSE 0 END,
    match_id,
    21 + mod(match_id - 11, 10) + 20 * ((match_id - 11) / 10),
    31 + mod(match_id - 11, 10) + 20 * ((match_id - 11) / 10),
    match_id,
    CASE WHEN mod(match_id, 23) = 0
        THEN CURRENT_TIMESTAMP - make_interval(days => 5 + mod(match_id, 45), hours => mod(match_id, 19))
        ELSE CURRENT_TIMESTAMP + make_interval(days => 2 + mod(match_id * 11, 180), hours => 12 + mod(match_id, 9))
    END,
    CASE WHEN mod(match_id, 23) = 0 THEN 'finished'
         WHEN mod(match_id, 19) = 0 THEN 'cancelled'
         WHEN mod(match_id, 13) = 0 THEN 'postponed'
         ELSE 'scheduled' END
FROM generate_series(11, 100) AS generated(match_id);

-- Forty-eight distinct seats per venue provide enough capacity for every match.
INSERT INTO seats (seat_id, venue_id, section_name, row_number, seat_number)
SELECT
    1000 + (venue_id - 1) * 48 + slot,
    venue_id,
    (ARRAY['North','East','West','South','Premium','Family','Accessible','Media'])[1 + ((slot - 1) / 6)],
    (1 + mod((slot - 1) / 3, 2))::text,
    (1 + mod(slot - 1, 3))::text
FROM generate_series(1, 100) AS venues(venue_id)
CROSS JOIN generate_series(1, 48) AS seat_slots(slot);

-- Each match receives a varied target of 28..36 tickets. Existing tickets are
-- retained and only the missing capacity is generated with unused venue seats.
WITH match_targets AS (
    SELECT m.match_id, m.venue_id, m.sport_type_id, m.status AS match_status,
           28 + mod(m.match_id * 7, 9) AS target_count,
           count(t.ticket_id)::int AS existing_count
    FROM matches m
    LEFT JOIN tickets t ON t.match_id = m.match_id
    GROUP BY m.match_id, m.venue_id, m.sport_type_id, m.status
), candidate_seats AS (
    SELECT mt.*, s.seat_id, s.section_name, s.row_number, s.seat_number,
           row_number() OVER (PARTITION BY mt.match_id ORDER BY s.seat_id) AS seat_rank
    FROM match_targets mt
    JOIN seats s ON s.venue_id = mt.venue_id AND s.seat_id >= 1000
), missing_tickets AS (
    SELECT *,
           1 + mod(seat_rank + match_id * 3, 10)::int AS category_id
    FROM candidate_seats
    WHERE seat_rank <= target_count - existing_count
), numbered_tickets AS (
    SELECT 31 + row_number() OVER (ORDER BY match_id, seat_id) AS ticket_id, *
    FROM missing_tickets
)
INSERT INTO tickets (
    ticket_id, match_id, venue_id, category_id, seat_id, price, status, created_at
)
SELECT
    ticket_id,
    match_id,
    venue_id,
    category_id,
    seat_id,
    90000 + sport_type_id * 25000 + category_id * 65000 +
        row_number::int * 15000 + seat_number::int * 7500 + mod(match_id, 7) * 10000,
    CASE WHEN match_status = 'cancelled' THEN 'cancelled'
         WHEN match_status = 'finished' AND mod(seat_rank, 5) = 0 THEN 'cancelled'
         WHEN match_status = 'finished' THEN 'sold'
         ELSE 'available' END,
    CURRENT_TIMESTAMP - make_interval(days => (3 + mod(match_id * 5 + seat_rank, 120))::int)
FROM numbered_tickets;

INSERT INTO orders (order_id, user_id, status, reserved_at, reserved_until)
SELECT
    order_id,
    14 + mod(order_id * 7, 117),
    order_status,
    reserved_at,
    reserved_at + INTERVAL '15 minutes'
FROM (
    SELECT order_id,
           CASE WHEN mod(order_id, 11) = 0 THEN 'pending'
                WHEN mod(order_id, 7) = 0 THEN 'expired'
                WHEN mod(order_id, 5) = 0 THEN 'cancelled'
                WHEN mod(order_id, 4) = 0 THEN 'partially_cancelled'
                ELSE 'paid' END AS order_status,
           CASE WHEN mod(order_id, 11) = 0
                THEN CURRENT_TIMESTAMP - make_interval(mins => mod(order_id, 5))
                ELSE CURRENT_TIMESTAMP - make_interval(days => 1 + mod(order_id * 3, 180), hours => mod(order_id, 12))
           END AS reserved_at
    FROM generate_series(13, 120) AS generated(order_id)
) generated_orders;

WITH order_slots AS (
    SELECT o.order_id, o.status AS order_status, o.reserved_at, o.reserved_until, slot,
           row_number() OVER (ORDER BY o.order_id, slot) AS ticket_rank
    FROM orders o
    CROSS JOIN LATERAL generate_series(
        1,
        CASE WHEN o.status = 'partially_cancelled' THEN 2
             ELSE 1 + mod(o.order_id, 2)::int END
    ) AS slots(slot)
    WHERE o.order_id >= 13
), ticket_pool AS (
    SELECT t.ticket_id, t.price,
           row_number() OVER (ORDER BY t.match_id, t.ticket_id) AS ticket_rank
    FROM tickets t
    JOIN matches m ON m.match_id = t.match_id
    WHERE t.ticket_id > 31
      AND t.status = 'available'
      AND m.status IN ('scheduled', 'postponed')
), reservation_rows AS (
    SELECT os.*, tp.ticket_id, tp.price,
           18 + row_number() OVER (ORDER BY os.order_id, os.slot) AS reservation_id
    FROM order_slots os
    JOIN ticket_pool tp USING (ticket_rank)
)
INSERT INTO reservations (
    reservation_id, order_id, ticket_id, status,
    price_at_reservation, created_at, cancelled_at
)
SELECT
    reservation_id,
    order_id,
    ticket_id,
    CASE WHEN order_status = 'paid' THEN 'paid'
         WHEN order_status = 'pending' THEN 'pending'
         WHEN order_status = 'expired' THEN 'expired'
         WHEN order_status = 'cancelled' THEN 'cancelled'
         WHEN slot = 1 THEN 'paid'
         ELSE 'cancelled' END,
    price,
    reserved_at,
    CASE WHEN order_status IN ('expired', 'cancelled')
              OR (order_status = 'partially_cancelled' AND slot > 1)
         THEN reserved_until + INTERVAL '5 minutes'
         ELSE NULL END
FROM reservation_rows;

UPDATE tickets t
SET status = CASE WHEN r.status = 'paid' THEN 'sold'
                  WHEN r.status = 'pending' THEN 'reserved'
                  ELSE 'available' END
FROM reservations r
WHERE r.ticket_id = t.ticket_id
  AND r.reservation_id > 18;

INSERT INTO payments (
    payment_id, order_id, amount, method, status, paid_at, transaction_code
)
SELECT
    12 + row_number() OVER (ORDER BY o.order_id),
    o.order_id,
    CASE WHEN o.status = 'partially_cancelled'
         THEN sum(r.price_at_reservation) FILTER (WHERE r.status = 'paid')
         ELSE sum(r.price_at_reservation) END,
    (ARRAY['bank_card','wallet','crypto'])[1 + mod(o.order_id, 3)],
    CASE WHEN o.status IN ('paid', 'partially_cancelled') THEN 'success'
         WHEN o.status = 'pending' THEN 'pending'
         ELSE 'failed' END,
    CASE WHEN o.status IN ('paid', 'partially_cancelled')
         THEN o.reserved_at + INTERVAL '4 minutes' ELSE NULL END,
    'SEED-TX-' || lpad(o.order_id::text, 5, '0')
FROM orders o
JOIN reservations r ON r.order_id = o.order_id
WHERE o.order_id >= 13
GROUP BY o.order_id, o.status, o.reserved_at;

WITH generated_reports AS (
    SELECT report_id, row_number() OVER (ORDER BY report_id) AS subject_rank
    FROM generate_series(11, 100) AS generated(report_id)
), reservation_subjects AS (
    SELECT r.reservation_id, r.order_id, o.user_id,
           row_number() OVER (ORDER BY r.reservation_id) AS subject_rank
    FROM reservations r
    JOIN orders o ON o.order_id = r.order_id
    WHERE r.reservation_id > 18
), ticket_subjects AS (
    SELECT t.ticket_id, row_number() OVER (ORDER BY t.ticket_id DESC) AS subject_rank
    FROM tickets t
    WHERE t.ticket_id > 31
)
INSERT INTO reports (
    report_id, user_id, order_id, ticket_id, reservation_id,
    report_category_id, description, status, created_at,
    reviewed_by_support_id, reviewed_at
)
SELECT
    gr.report_id,
    CASE WHEN mod(gr.report_id, 2) = 0 THEN rs.user_id
         ELSE 14 + mod(gr.report_id * 7, 117) END,
    CASE WHEN mod(gr.report_id, 2) = 0 THEN rs.order_id ELSE NULL END,
    CASE WHEN mod(gr.report_id, 2) = 1 THEN ts.ticket_id ELSE NULL END,
    CASE WHEN mod(gr.report_id, 2) = 0 THEN rs.reservation_id ELSE NULL END,
    1 + mod(gr.report_id * 3, 10),
    (ARRAY[
        'Payment confirmation needs review',
        'Seat information differs from expectation',
        'Venue access instructions were unclear',
        'Ticket price requires clarification',
        'Match schedule notification was delayed'
    ])[1 + mod(gr.report_id, 5)] || ' (sample report ' || gr.report_id || ')',
    CASE WHEN mod(gr.report_id, 5) = 0 THEN 'rejected'
         WHEN mod(gr.report_id, 3) = 0 THEN 'reviewed'
         ELSE 'pending' END,
    CURRENT_TIMESTAMP - make_interval(days => mod(gr.report_id * 5, 150), hours => mod(gr.report_id, 20)),
    CASE WHEN mod(gr.report_id, 5) = 0 OR mod(gr.report_id, 3) = 0
         THEN 11 + mod(gr.report_id, 3) ELSE NULL END,
    CASE WHEN mod(gr.report_id, 5) = 0 OR mod(gr.report_id, 3) = 0
         THEN CURRENT_TIMESTAMP - make_interval(days => mod(gr.report_id * 5, 150)) + INTERVAL '2 hours'
         ELSE NULL END
FROM generated_reports gr
LEFT JOIN reservation_subjects rs
    ON mod(gr.report_id, 2) = 0 AND rs.subject_rank = (gr.subject_rank + 1) / 2
LEFT JOIN ticket_subjects ts
    ON mod(gr.report_id, 2) = 1 AND ts.subject_rank = (gr.subject_rank + 1) / 2;

INSERT INTO ticket_facilities (ticket_id, facility_id)
SELECT
    t.ticket_id,
    1 + mod(t.ticket_id + facility_slot * 3, 10)
FROM tickets t
CROSS JOIN LATERAL generate_series(1, 1 + mod(t.ticket_id, 3)::int) AS slots(facility_slot)
WHERE t.ticket_id > 31
  AND mod(t.ticket_id, 5) = 0;

SELECT setval('provinces_province_id_seq', (SELECT MAX(province_id) FROM provinces));
SELECT setval('cities_city_id_seq', (SELECT MAX(city_id) FROM cities));
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('organizers_organizer_id_seq', (SELECT MAX(organizer_id) FROM organizers));
SELECT setval('sport_types_sport_type_id_seq', (SELECT MAX(sport_type_id) FROM sport_types));
SELECT setval('teams_team_id_seq', (SELECT MAX(team_id) FROM teams));
SELECT setval('venues_venue_id_seq', (SELECT MAX(venue_id) FROM venues));
SELECT setval('competitions_competition_id_seq', (SELECT MAX(competition_id) FROM competitions));
SELECT setval('matches_match_id_seq', (SELECT MAX(match_id) FROM matches));
SELECT setval('ticket_categories_category_id_seq', (SELECT MAX(category_id) FROM ticket_categories));
SELECT setval('seats_seat_id_seq', (SELECT MAX(seat_id) FROM seats));
SELECT setval('tickets_ticket_id_seq', (SELECT MAX(ticket_id) FROM tickets));
SELECT setval('orders_order_id_seq', (SELECT MAX(order_id) FROM orders));
SELECT setval('reservations_reservation_id_seq', (SELECT MAX(reservation_id) FROM reservations));
SELECT setval('payments_payment_id_seq', (SELECT MAX(payment_id) FROM payments));
SELECT setval('cancellation_policies_policy_id_seq', (SELECT MAX(policy_id) FROM cancellation_policies));
SELECT setval('cancellation_policy_rules_rule_id_seq', (SELECT MAX(rule_id) FROM cancellation_policy_rules));
SELECT setval('cancellation_requests_request_id_seq', (SELECT MAX(request_id) FROM cancellation_requests));
SELECT setval('refunds_refund_id_seq', (SELECT MAX(refund_id) FROM refunds));
SELECT setval('report_categories_report_category_id_seq', (SELECT MAX(report_category_id) FROM report_categories));
SELECT setval('reports_report_id_seq', (SELECT MAX(report_id) FROM reports));
SELECT setval('facilities_facility_id_seq', (SELECT MAX(facility_id) FROM facilities));
