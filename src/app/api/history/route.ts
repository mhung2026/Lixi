import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RoomRow {
  id: string;
  code: string;
  host_name: string;
  mode: string;
  max_shakes: number;
  status: string;
  created_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.replace(/[^\d]/g, '');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 });
  }

  // --- Rooms the user CREATED (as host) ---
  const { data: hostedRooms } = await supabase
    .from('rooms')
    .select('id, code, host_name, mode, max_shakes, status, created_at')
    .eq('host_phone', phone)
    .order('created_at', { ascending: false });

  // --- Rooms the user PLAYED in (as player) ---
  const { data: players } = await supabase
    .from('players')
    .select('id, name, phone, shakes_used, room_id, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false });

  let playedRooms: RoomRow[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: any[] = [];

  if (players && players.length > 0) {
    const roomIds = [...new Set(players.map((p) => p.room_id))];

    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, code, host_name, mode, max_shakes, status, created_at')
      .in('id', roomIds)
      .order('created_at', { ascending: false });

    playedRooms = (rooms || []) as RoomRow[];

    const playerIds = players.map((p) => p.id);
    const { data: resultData } = await supabase
      .from('results')
      .select('id, player_id, prize_id, room_id, created_at, prizes(name, type, value)')
      .in('player_id', playerIds)
      .order('created_at', { ascending: false });

    results = resultData || [];
  }

  return NextResponse.json({
    players: players || [],
    played_rooms: playedRooms,
    hosted_rooms: (hostedRooms || []) as RoomRow[],
    results,
  });
}
