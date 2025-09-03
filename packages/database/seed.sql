-- Seed data for major marathons
insert into races (name, url, open_keywords, closed_keywords) values
(
  'Boston Marathon',
  'https://www.baa.org/races/boston-marathon/enter/registration',
  array['registration is open', 'register now', 'apply now', 'registration period'],
  array['registration closed', 'registration has closed', 'application period closed']
),
(
  'TCS London Marathon',
  'https://www.londonmarathonevents.co.uk/london-marathon/enter-ballot',
  array['ballot is open', 'enter ballot', 'ballot entry', 'apply for ballot'],
  array['ballot closed', 'ballot has closed', 'entries closed', 'ballot draw complete']
),
(
  'BMW Berlin Marathon',
  'https://www.bmw-berlin-marathon.com/en/registration/',
  array['registration open', 'register now', 'apply now'],
  array['registration closed', 'sold out', 'fully booked']
),
(
  'Bank of America Chicago Marathon',
  'https://www.chicagomarathon.com/participants/getting-in/guaranteed-entry/',
  array['registration open', 'guaranteed entry', 'apply now'],
  array['registration closed', 'sold out', 'waitlist only']
),
(
  'TCS New York City Marathon',
  'https://www.nyrr.org/tcsnycmarathon/participants/getting-in',
  array['lottery open', 'enter lottery', 'apply for lottery'],
  array['lottery closed', 'application period closed']
),
(
  'Tokyo Marathon',
  'https://www.marathon.tokyo/en/participants/',
  array['entry period', 'application period', 'lottery entry'],
  array['application closed', 'entry period closed', 'lottery closed']
),
(
  'Schneider Electric Paris Marathon',
  'https://www.schneiderelectricparismarathon.com/en/registration/',
  array['registration open', 'register now'],
  array['registration closed', 'sold out', 'entries closed']
),
(
  'Valencia Marathon Trinidad Alfonso',
  'https://www.valenciamarathon.com/en/inscripciones/',
  array['registration open', 'inscriptions open', 'register'],
  array['sold out', 'inscriptions closed', 'registration closed']
),
(
  'Access Bank Lagos City Marathon',
  'https://lagoscitymarathon.com/',
  array['registration open', 'register now', 'sign up'],
  array['registration closed', 'entries closed']
),
(
  'Comrades Marathon',
  'https://www.comrades.com/race-information/entries/',
  array['entries open', 'enter now', 'registration open'],
  array['entries closed', 'sold out', 'registration closed']
);

-- Set all races to 'closed' initially (they will be updated by the scraper)
update races set current_status = 'closed';