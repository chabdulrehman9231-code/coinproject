-- Drop old tables and triggers if they exist to apply changes cleanly
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists orders cascade;
drop table if exists wallets cascade;
drop table if exists profiles cascade;
drop table if exists users cascade;

-- Create the public "users" table
create table users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone_number text,
  role text default 'user' not null, -- 'user' or 'admin'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for wallets (user balances)
create table wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  asset text not null, -- e.g., 'USDT', 'BTC'
  balance numeric default 0 not null,
  unique(user_id, asset)
);

-- Create a table for trades/orders
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  symbol text not null, -- e.g., 'BTCUSDT'
  order_type text not null, -- 'MARKET' or 'LIMIT'
  side text not null, -- 'BUY' or 'SELL'
  price numeric not null,
  amount numeric not null,
  status text not null default 'FILLED', -- 'OPEN', 'FILLED', 'CANCELLED'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table users enable row level security;
alter table wallets enable row level security;
alter table orders enable row level security;

-- Policies for users table
create policy "Users can view their own data." on users for select using ( auth.uid() = id );
create policy "Users can update their own data." on users for update using ( auth.uid() = id );

-- Policies for wallets
create policy "Users can view their own wallets." on wallets for select using ( auth.uid() = user_id );

-- Policies for orders
create policy "Users can view their own orders." on orders for select using ( auth.uid() = user_id );
create policy "Users can insert their own orders." on orders for insert with check ( auth.uid() = user_id );

-- Function to handle new user signup and create default 0 balance wallet
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone_number, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    'user'
  );
  
  -- Only create a default USDT wallet with 0 balance
  insert into public.wallets (user_id, asset, balance)
  values (new.id, 'USDT', 0);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function after a user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
