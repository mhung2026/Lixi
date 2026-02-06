import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên' }, { status: 400 });
    }

    // Find room
    const { data: room } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('code', code.toUpperCase())
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    }

    if (room.status === 'ended') {
      return NextResponse.json({ error: 'Phòng đã kết thúc' }, { status: 410 });
    }

    // Create player
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        name: name.trim(),
        phone: phone || null,
        shakes_used: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ player_id: player.id });
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
