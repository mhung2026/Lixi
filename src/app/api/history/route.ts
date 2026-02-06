import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.replace(/[^\d]/g, '');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 });
  }

  // Find all players with this phone number
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, name, phone, shakes_used, room_id, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false });

  if (playersError || !players || players.length === 0) {
    return NextResponse.json({ players: [], rooms: [], results: [] });
  }

  // Get unique room IDs
  const roomIds = [...new Set(players.map((p) => p.room_id))];

  // Fetch rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, code, host_name, mode, max_shakes, status, created_at')
    .in('id', roomIds)
    .order('created_at', { ascending: false });

  // Fetch results for these players
  const playerIds = players.map((p) => p.id);
  const { data: results } = await supabase
    .from('results')
    .select('id, player_id, prize_id, room_id, created_at, prizes(name, type, value)')
    .in('player_id', playerIds)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    players: players || [],
    rooms: rooms || [],
    results: results || [],
  });
}
