import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host_name, host_phone, mode, max_shakes, game_modes, prizes } = body;

    if (!host_name || !prizes || prizes.length === 0) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Generate unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', code)
        .single();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        host_name,
        host_phone: host_phone || null,
        mode: mode || 'online',
        max_shakes: max_shakes || 1,
        game_modes: game_modes && game_modes.length > 0 ? game_modes : ['shake'],
        status: 'active',
      })
      .select()
      .single();

    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 500 });
    }

    // Create prizes
    const prizeRows = prizes.map((p: { type: string; name: string; value: number; quantity: number }) => ({
      room_id: room.id,
      type: p.type || 'cash',
      name: p.name,
      value: p.value || 0,
      quantity: p.quantity || 1,
      remaining: p.quantity || 1,
    }));

    const { error: prizeError } = await supabase.from('prizes').insert(prizeRows);

    if (prizeError) {
      return NextResponse.json({ error: prizeError.message }, { status: 500 });
    }

    return NextResponse.json({ id: room.id, code: room.code });
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
