# مدل رابطه‌ای نهایی

```text
roles(
    role_id PK,
    role_name UNIQUE
)

provinces(
    province_id PK,
    name UNIQUE
)

cities(
    city_id PK,
    province_id FK -> provinces.province_id,
    name,
    UNIQUE(province_id, name)
)

users(
    user_id PK,
    role_id FK -> roles.role_id,
    city_id FK -> cities.city_id,
    first_name,
    last_name,
    email UNIQUE,
    phone UNIQUE,
    password_hash,
    profile_image_url,
    status,
    registered_at,
    UNIQUE(user_id, role_id)
)

support_users(
    user_id PK,
    support_role_id,
    FK(user_id, support_role_id) -> users(user_id, role_id)
)

organizers(
    organizer_id PK,
    city_id FK -> cities.city_id,
    name,
    email UNIQUE,
    phone UNIQUE,
    status,
    created_at
)

sport_types(
    sport_type_id PK,
    name UNIQUE
)

teams(
    team_id PK,
    sport_type_id FK -> sport_types.sport_type_id,
    city_id FK -> cities.city_id,
    name,
    UNIQUE(sport_type_id, name),
    UNIQUE(team_id, sport_type_id)
)

venues(
    venue_id PK,
    city_id FK -> cities.city_id,
    name,
    address,
    venue_type,
    UNIQUE(city_id, name)
)

competitions(
    competition_id PK,
    sport_type_id FK -> sport_types.sport_type_id,
    name,
    UNIQUE(sport_type_id, name),
    UNIQUE(competition_id, sport_type_id)
)

matches(
    match_id PK,
    sport_type_id FK -> sport_types.sport_type_id,
    competition_id,
    organizer_id FK -> organizers.organizer_id,
    home_team_id,
    away_team_id,
    venue_id FK -> venues.venue_id,
    match_datetime,
    status,
    UNIQUE(match_id, venue_id),
    UNIQUE(match_id, organizer_id, sport_type_id),
    FK(home_team_id, sport_type_id) -> teams(team_id, sport_type_id),
    FK(away_team_id, sport_type_id) -> teams(team_id, sport_type_id),
    FK(competition_id, sport_type_id) -> competitions(competition_id, sport_type_id)
)

ticket_categories(
    category_id PK,
    name UNIQUE,
    description
)

seats(
    seat_id PK,
    venue_id FK -> venues.venue_id,
    section_name,
    row_number,
    seat_number,
    UNIQUE(venue_id, section_name, row_number, seat_number),
    UNIQUE(seat_id, venue_id)
)

tickets(
    ticket_id PK,
    match_id,
    venue_id,
    category_id FK -> ticket_categories.category_id,
    seat_id,
    price,
    status,
    created_at,
    UNIQUE(match_id, seat_id),
    UNIQUE(ticket_id, match_id),
    FK(match_id, venue_id) -> matches(match_id, venue_id),
    FK(seat_id, venue_id) -> seats(seat_id, venue_id)
)

orders(
    order_id PK,
    user_id FK -> users.user_id,
    status,
    reserved_at,
    reserved_until,
    UNIQUE(order_id, user_id)
)

reservations(
    reservation_id PK,
    order_id FK -> orders.order_id,
    ticket_id FK -> tickets.ticket_id,
    status,
    price_at_reservation,
    created_at,
    cancelled_at,
    UNIQUE(reservation_id, order_id),
    UNIQUE(reservation_id, order_id, ticket_id)
)

payments(
    payment_id PK,
    order_id FK -> orders.order_id,
    amount,
    method,
    status,
    paid_at,
    transaction_code UNIQUE,
    UNIQUE(payment_id, order_id)
)

cancellation_policies(
    policy_id PK,
    organizer_id FK -> organizers.organizer_id,
    sport_type_id FK -> sport_types.sport_type_id,
    name,
    status,
    created_at,
    UNIQUE(organizer_id, sport_type_id, name),
    UNIQUE(policy_id, organizer_id, sport_type_id)
)

cancellation_policy_rules(
    rule_id PK,
    policy_id FK -> cancellation_policies.policy_id,
    min_hours_before_match,
    max_hours_before_match,
    penalty_percent,
    UNIQUE(rule_id, policy_id),
    EXCLUDE no overlapping time ranges per policy_id
)

cancellation_requests(
    request_id PK,
    order_id,
    user_id,
    request_type,
    reason,
    status,
    requested_at,
    reviewed_by_support_id FK -> support_users.user_id,
    reviewed_at,
    FK(order_id, user_id) -> orders(order_id, user_id),
    UNIQUE(request_id, order_id),
    UNIQUE(request_id, order_id, request_type)
)

cancellation_request_items(
    request_id,
    order_id,
    request_type,
    reservation_id,
    ticket_id,
    match_id,
    item_action,
    requested_new_ticket_id,
    policy_id,
    policy_rule_id,
    organizer_id,
    sport_type_id,
    penalty_percent_applied,
    refund_amount,
    status,
    PK(request_id, reservation_id),
    FK(request_id, order_id, request_type) -> cancellation_requests(request_id, order_id, request_type),
    FK(reservation_id, order_id, ticket_id) -> reservations(reservation_id, order_id, ticket_id),
    FK(ticket_id, match_id) -> tickets(ticket_id, match_id),
    FK(requested_new_ticket_id, match_id) -> tickets(ticket_id, match_id),
    FK(match_id, organizer_id, sport_type_id) -> matches(match_id, organizer_id, sport_type_id),
    FK(policy_id, organizer_id, sport_type_id) -> cancellation_policies(policy_id, organizer_id, sport_type_id),
    FK(policy_rule_id, policy_id) -> cancellation_policy_rules(rule_id, policy_id)
)

refunds(
    refund_id PK,
    payment_id,
    cancellation_request_id,
    order_id,
    amount,
    status,
    refunded_at,
    FK(payment_id, order_id) -> payments(payment_id, order_id),
    FK(cancellation_request_id, order_id) -> cancellation_requests(request_id, order_id)
)

report_categories(
    report_category_id PK,
    name UNIQUE
)

reports(
    report_id PK,
    user_id FK -> users.user_id,
    order_id,
    ticket_id,
    reservation_id,
    report_category_id FK -> report_categories.report_category_id,
    description,
    status,
    created_at,
    reviewed_by_support_id FK -> support_users.user_id,
    reviewed_at,
    FK(ticket_id) -> tickets.ticket_id,
    FK(order_id, user_id) -> orders(order_id, user_id),
    FK(reservation_id, order_id) -> reservations(reservation_id, order_id)
)

facilities(
    facility_id PK,
    name UNIQUE
)

ticket_facilities(
    ticket_id FK -> tickets.ticket_id,
    facility_id FK -> facilities.facility_id,
    PK(ticket_id, facility_id)
)
```
