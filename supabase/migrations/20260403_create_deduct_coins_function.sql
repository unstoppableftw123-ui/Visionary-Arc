create or replace function deduct_coins(p_user_id uuid, p_amount int, p_reason text)
returns void
language plpgsql
as $$
declare
  v_balance_after int;
begin
  update profiles
  set coins = coins - p_amount
  where id = p_user_id
    and coins >= p_amount
  returning coins into v_balance_after;

  if not found then
    raise exception 'insufficient_coins';
  end if;

  insert into coins_transactions(user_id, amount, reason, balance_after)
  values (p_user_id, -p_amount, p_reason, v_balance_after);
end;
$$;
