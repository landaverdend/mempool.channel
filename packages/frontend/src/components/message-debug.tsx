import { Message } from '@mempool/shared';

type MessageDebugProps = {
  messages: Message[];
};
export default function MessageDebug({ messages }: MessageDebugProps) {
  return (
    <div className="bg-slate-800 p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Messages (Debug)</h2>
      <ul className="max-h-48 overflow-y-auto">
        {messages.slice(-20).map((msg) => (
          <li key={msg.id} className="p-2 border-b border-slate-700 last:border-b-0 font-mono text-xs text-gray-400">
            [{msg.type}] {JSON.stringify(msg.payload).slice(0, 80)}...
          </li>
        ))}
      </ul>
    </div>
  );
}
