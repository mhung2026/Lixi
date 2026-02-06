import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
  }

  if (room.status === 'ended') {
    return NextResponse.json({ error: 'Phòng đã kết thúc' }, { status: 410 });
  }

  // Fetch prizes
  const { data: prizes } = await supabase
    .from('prizes')
    .select('*')
    .eq('room_id', room.id);

  // Fetch players
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true });

  // Fetch results with related data
  const { data: results } = await supabase
    .from('results')
    .select('*, players(name), prizes(name, type, value)')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    room,
    prizes: prizes || [],
    players: players || [],
    results: results || [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();

  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (!room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: body.status })
    .eq('id', room.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
