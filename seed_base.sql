SET search_path TO book_the_game;

INSERT INTO roles (role_id, role_name)
VALUES
(1, 'spectator'),
(2, 'support');

INSERT INTO sport_types (name)
VALUES
('Football'),
('Volleyball'),
('Basketball');

INSERT INTO ticket_categories (name, description)
VALUES
('Normal', 'Regular ticket category'),
('Special', 'Special ticket category'),
('VIP', 'VIP ticket category');

INSERT INTO report_categories (name)
VALUES
('Payment Problem'),
('Seat Problem'),
('Unexpected Cancellation'),
('Wrong Ticket Information');

INSERT INTO facilities (name)
VALUES
('Parking'),
('Catering'),
('Covered Seat'),
('Dedicated Entrance');
