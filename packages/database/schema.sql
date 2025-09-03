-- Enable necessary extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Custom types
create type email_status as enum ('pending','active','bounced','unsubscribed','complained');
create type race_status as enum ('unknown','open','closed','full');

-- Subscribers table
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  status email_status not null default 'active',
  timezone text not null default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Races table
create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  open_keywords text[] not null default array['register','registration','entry','entries','apply','ballot','open'],
  closed_keywords text[] not null default array['closed','sold out','full','waitlist','ballot closed','entries closed'],
  current_status race_status not null default 'unknown',
  last_scraped_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions table (many-to-many relationship)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references subscribers(id) on delete cascade,
  race_id uuid references races(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique (subscriber_id, race_id)
);

-- Notifications table (log of sent notifications)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  race_id uuid references races(id) on delete cascade,
  recipient_email citext not null,
  subject text not null,
  body text not null,
  sent_at timestamptz default now(),
  unique (race_id, recipient_email) -- Prevent duplicate notifications for same race/email
);

-- Function to handle registration opened notifications
create or replace function notify_registration_opened(p_race_id uuid, p_new_status race_status)
returns table(notifications_sent int)
language plpgsql security definer
as $$
declare
  notification_count int := 0;
  race_record record;
begin
  -- Get race information
  select * into race_record from races where id = p_race_id;
  
  if race_record is null then
    raise exception 'Race not found';
  end if;
  
  -- Update race status
  update races 
  set current_status = p_new_status, 
      last_scraped_at = now(),
      updated_at = now()
  where id = p_race_id;
  
  -- Only send notifications if status changed to 'open'
  if p_new_status = 'open' and race_record.current_status != 'open' then
    -- Insert notifications for active subscribers
    insert into notifications (race_id, recipient_email, subject, body)
    select 
      r.id,
      sub.email,
      'Registration just opened: ' || r.name,
      format('Great news! Registration for %s just opened. 

Visit: %s

This is an automated alert from Race Alert. You''re receiving this because you signed up for notifications about this race.', r.name, r.url)
    from races r
    join subscriptions s on s.race_id = r.id and s.is_active = true
    join subscribers sub on sub.id = s.subscriber_id and sub.status = 'active'
    where r.id = p_race_id
    on conflict (race_id, recipient_email) do nothing;
    
    -- Get count of notifications that were actually inserted
    get diagnostics notification_count = row_count;
  end if;
  
  return query select notification_count;
end;
$$;

-- Create indexes for better performance
create index if not exists idx_subscribers_email on subscribers(email);
create index if not exists idx_subscribers_status on subscribers(status);
create index if not exists idx_races_status on races(current_status);
create index if not exists idx_subscriptions_subscriber_race on subscriptions(subscriber_id, race_id);
create index if not exists idx_notifications_race_email on notifications(race_id, recipient_email);

-- Row Level Security (RLS) policies
alter table subscribers enable row level security;
alter table races enable row level security;
alter table subscriptions enable row level security;
alter table notifications enable row level security;

-- Allow public read access to races
create policy "Public can view races" on races for select using (true);

-- Subscribers can only see/modify their own data
create policy "Users can view own subscriber record" on subscribers 
  for select using (auth.jwt() ->> 'email' = email::text);

create policy "Users can update own subscriber record" on subscribers 
  for update using (auth.jwt() ->> 'email' = email::text);

-- Allow service role full access (for API operations)
create policy "Service role has full access" on subscribers
  for all using (auth.role() = 'service_role');
  
create policy "Service role has full access" on races
  for all using (auth.role() = 'service_role');
  
create policy "Service role has full access" on subscriptions
  for all using (auth.role() = 'service_role');
  
create policy "Service role has full access" on notifications
  for all using (auth.role() = 'service_role');