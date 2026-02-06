import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { player_id } = body;

    if (!player_id) {
      return NextResponse.json({ error: 'Thiếu thông tin người chơi' }, { status: 400 });
    }

    // Find room
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    }

    // Call the atomic claim_prize RPC function
    const { data, error } = await supabase.rpc('claim_prize', {
      p_room_id: room.id,
      p_player_id: player_id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
