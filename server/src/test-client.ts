import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3001';

function connect(label: string): Socket {
  const socket = io(URL);
  socket.on('connect', () => console.log(`[${label}] connected: ${socket.id}`));
  socket.on('error', (data: { message: string }) => console.log(`[${label}] error: ${data.message}`));
  socket.on('member-joined', (data) => console.log(`[${label}] member-joined:`, data));
  socket.on('member-left', (data) => console.log(`[${label}] member-left:`, data));
  socket.on('location-update', (data) => console.log(`[${label}] location-update:`, data));
  socket.on('signal-received', (data) => console.log(`[${label}] signal-received:`, data));
  return socket;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- Starting test ---');

  const client1 = connect('Host');
  await sleep(500);

  // Host creates session
  const createResult = await new Promise<{ code: string; memberId: string }>((resolve) => {
    client1.emit('create-session', { name: 'Alice', color: '#60A5FA' }, resolve);
  });
  console.log(`[Host] created session: code=${createResult.code} memberId=${createResult.memberId}`);

  await sleep(300);

  // Guest joins session
  const client2 = connect('Guest');
  await sleep(500);

  const joinResult = await new Promise<{ members: any[]; memberId: string }>((resolve) => {
    client2.emit('join-session', { code: createResult.code, name: 'Bob', color: '#4ADE80' }, resolve);
  });
  console.log(`[Guest] joined session: memberId=${joinResult.memberId}, members:`, joinResult.members);

  await sleep(300);

  // Host sends location
  client1.emit('update-location', { lat: 40.7128, lng: -74.006 });
  console.log('[Host] sent location');
  await sleep(300);

  // Guest sends location
  client2.emit('update-location', { lat: 40.7138, lng: -74.005 });
  console.log('[Guest] sent location');
  await sleep(300);

  // Host sends signal
  client1.emit('send-signal', { type: 'where' });
  console.log('[Host] sent "where" signal');
  await sleep(300);

  // Guest sends signal
  client2.emit('send-signal', { type: 'coming' });
  console.log('[Guest] sent "coming" signal');
  await sleep(500);

  // Guest disconnects
  console.log('[Guest] disconnecting...');
  client2.disconnect();
  await sleep(500);

  // Host disconnects
  console.log('[Host] disconnecting...');
  client1.disconnect();
  await sleep(300);

  console.log('--- Test complete ---');
  process.exit(0);
}

main().catch(console.error);
