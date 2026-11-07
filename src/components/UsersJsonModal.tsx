import React, { useState, useEffect } from 'react';
import { X, FileJson, RefreshCw, Copy, Check, Users, Database } from 'lucide-react';
import { AuthService } from '../services/authService';

interface UsersJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsersJsonModal: React.FC<UsersJsonModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [rawJson, setRawJson] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'json'>('cards');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users/raw');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setRawJson(JSON.stringify(data, null, 2));
      } else {
        const fallback = await AuthService.getUsers();
        setUsers(fallback);
        setRawJson(JSON.stringify(fallback, null, 2));
      }
    } catch {
      const fallback = await AuthService.getUsers();
      setUsers(fallback);
      setRawJson(JSON.stringify(fallback, null, 2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c241a] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#081b13] border-b border-emerald-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-600/40 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Local Storage: data/users.json</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
                  {users.length} Records
                </span>
              </h3>
              <p className="text-[11px] text-emerald-400/80">
                Live inspect the persistent JSON file where new users are pushed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/40 rounded-lg transition-colors"
              title="Refresh from disk"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/40 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="px-6 py-2 bg-[#071610] border-b border-emerald-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'cards'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" />
              <span>User Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'json'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 inline mr-1" />
              <span>Raw JSON File</span>
            </button>
          </div>

          {activeTab === 'json' && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 rounded border border-emerald-700/50 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-xs">
          {activeTab === 'cards' ? (
            <div className="space-y-3">
              {users.map((u, i) => (
                <div
                  key={u.id || i}
                  className="p-3.5 rounded-xl bg-[#081b13] border border-emerald-700/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <span>{u.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {u.role || 'Engineer'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-300/80">{u.email}</div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono text-emerald-600">
                    <div>ID: {u.id}</div>
                    <div>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className="p-4 rounded-xl bg-[#06140e] border border-emerald-800/50 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto select-text whitespace-pre">
              {rawJson}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
